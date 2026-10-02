<?php
/**
 * Sincronización Inmovilla → WordPress.
 *
 * INMOVILLA → API → WORDPRESS (CPT property) → operation / property_type / zone / location → WEB
 *
 * - Cron horario (+ botón manual en Herramientas → Albor · Inmovilla, + WP-CLI `wp albor sync`).
 * - Upsert por referencia: la referencia de Inmovilla es la clave única (meta `reference`).
 * - Huella (hash) del registro: si nada ha cambiado, no se toca el post ni se vuelven a descargar fotos.
 * - Propiedades que desaparecen del feed → estado "retirado" (borrador), nunca se borran.
 *
 * IMPORTANTE: los nombres de campo de Inmovilla de self::MAP son orientativos y deben validarse con la
 * documentación de la API/feed contratado por la firma (API REST o exportación XML de Inmovilla).
 */

defined('ABSPATH') || exit;

final class Albor_Inmovilla_Sync {

	/** campo Inmovilla (orientativo) => meta Albor */
	const MAP = [
		'ref'            => 'reference',
		'precioinmo'     => 'price',      // venta
		'precioalq'      => 'price',      // alquiler (se usa si la operación es alquiler)
		'm_cons'         => 'surface',
		'm_parcela'      => 'plot',
		'habitaciones'   => 'rooms',
		'banyos'         => 'bathrooms',
		'm_terraza'      => 'terrace',
		'plazas_garaje'  => 'garage',
		'planta'         => 'floor',
		'antiguedad'     => 'year_built',
		'energialetra'   => 'energy',
		'latitud'        => 'lat',
		'altitud'        => 'lng',        // en algunos feeds de Inmovilla la longitud llega como "altitud"
		'video'          => 'video',
		'agente'         => 'agent',
	];

	/** Tipos de Inmovilla → slug de property_type (ajustar a los códigos reales del feed). */
	const TYPES = [
		'piso' => 'piso', 'apartamento' => 'piso', 'atico' => 'atico', 'duplex' => 'piso', 'chalet' => 'chalet',
		'casa' => 'casa', 'villa' => 'villa', 'adosado' => 'adosado', 'local' => 'local', 'oficina' => 'oficina',
		'solar' => 'terreno', 'terreno' => 'terreno', 'parking' => 'garaje', 'garaje' => 'garaje', 'edificio' => 'edificio',
	];

	public static function init(): void {
		add_action('albor_inmovilla_sync', [__CLASS__, 'run']);
		add_action('admin_menu', fn() => add_management_page('Albor · Inmovilla', 'Albor · Inmovilla', 'manage_options', 'albor-inmovilla', [__CLASS__, 'screen']));
		add_action('admin_post_albor_sync_now', function () {
			check_admin_referer('albor_sync_now');
			if (!current_user_can('manage_options')) wp_die('Sin permisos');
			$r = self::run();
			wp_safe_redirect(add_query_arg('albor_sync', rawurlencode(wp_json_encode($r)), wp_get_referer()));
			exit;
		});
		if (defined('WP_CLI') && WP_CLI) WP_CLI::add_command('albor sync', fn() => WP_CLI::log(wp_json_encode(self::run())));
	}

	/** Descarga el feed. Credenciales en wp-config.php: ALBOR_INMOVILLA_URL, ALBOR_INMOVILLA_TOKEN. */
	private static function fetch(): array {
		if (!defined('ALBOR_INMOVILLA_URL')) return [];
		$res = wp_remote_get(ALBOR_INMOVILLA_URL, ['timeout' => 60, 'headers' => defined('ALBOR_INMOVILLA_TOKEN') ? ['Authorization' => 'Bearer ' . ALBOR_INMOVILLA_TOKEN] : []]);
		if (is_wp_error($res) || wp_remote_retrieve_response_code($res) !== 200) { error_log('[Albor] Inmovilla: ' . (is_wp_error($res) ? $res->get_error_message() : wp_remote_retrieve_response_code($res))); return []; }
		$body = wp_remote_retrieve_body($res);
		if (str_starts_with(ltrim($body), '<')) { // exportación XML
			$xml = simplexml_load_string($body, 'SimpleXMLElement', LIBXML_NOCDATA);
			return $xml ? json_decode(wp_json_encode($xml->xpath('//propiedad') ?: []), true) : [];
		}
		$json = json_decode($body, true);
		return $json['propiedades'] ?? $json ?? [];
	}

	public static function run(): array {
		$items = self::fetch();
		if (!$items) return ['ok' => false, 'msg' => 'Feed vacío o no configurado'];
		$seen = []; $stats = ['created' => 0, 'updated' => 0, 'unchanged' => 0, 'retired' => 0];
		foreach ($items as $it) {
			$ref = sanitize_text_field((string) ($it['ref'] ?? ''));
			if (!$ref) continue;
			$seen[] = $ref;
			$stats[self::upsert($it, $ref)]++;
		}
		// Retirar (no borrar) las que ya no vienen en el feed
		foreach (get_posts(['post_type' => 'property', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => [['key' => 'reference', 'value' => $seen, 'compare' => 'NOT IN']]]) as $id) {
			wp_update_post(['ID' => $id, 'post_status' => 'draft']); update_post_meta($id, 'status', 'retirado'); $stats['retired']++;
		}
		delete_transient('albor_stats');
		update_option('albor_last_sync', ['at' => current_time('c')] + $stats, false);
		return ['ok' => true] + $stats;
	}

	private static function upsert(array $it, string $ref): string {
		$hash = md5(wp_json_encode($it));
		$existing = get_posts(['post_type' => 'property', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'reference', 'meta_value' => $ref]);
		$id = $existing[0] ?? 0;
		if ($id && get_post_meta($id, 'inmovilla_hash', true) === $hash) return 'unchanged';

		$operation = !empty($it['precioalq']) && empty($it['precioinmo']) ? 'alquiler' : 'venta';
		$status = ['1' => 'disponible', '2' => 'reservado', '3' => 'vendido', '4' => 'alquilado'][(string) ($it['estado'] ?? '1')] ?? 'disponible';
		$postarr = [
			'ID' => $id, 'post_type' => 'property',
			'post_status' => in_array($status, ['vendido', 'alquilado'], true) ? 'draft' : 'publish',
			'post_title' => sanitize_text_field($it['titulo'] ?? "Propiedad {$ref}"),
			'post_content' => wp_kses_post($it['descripcion'] ?? ''),
			'post_name' => sanitize_title($it['titulo'] ?? $ref),
		];
		$id = $id ? wp_update_post($postarr) : wp_insert_post($postarr);
		if (is_wp_error($id) || !$id) return 'unchanged';

		foreach (self::MAP as $src => $meta) {
			if (!isset($it[$src]) || $it[$src] === '') continue;
			if ($meta === 'price' && (($src === 'precioalq') !== ($operation === 'alquiler'))) continue;
			update_post_meta($id, $meta, is_numeric($it[$src]) ? $it[$src] + 0 : sanitize_text_field($it[$src]));
		}
		update_post_meta($id, 'status', $status);
		update_post_meta($id, 'price_period', $operation === 'alquiler' ? 'mes' : '');
		update_post_meta($id, 'inmovilla_hash', $hash);

		wp_set_object_terms($id, $operation, 'operation');
		$t = strtolower(remove_accents((string) ($it['tipo'] ?? '')));
		wp_set_object_terms($id, self::TYPES[$t] ?? 'otros', 'property_type');
		if (!empty($it['ciudad'])) wp_set_object_terms($id, sanitize_text_field($it['ciudad']), 'location');
		if (!empty($it['zona'])) wp_set_object_terms($id, sanitize_title($it['zona']), 'zone');
		$features = [];
		foreach (['terraza' => 'terraza', 'piscina' => 'piscina', 'ascensor' => 'ascensor', 'garaje' => 'garaje', 'exterior' => 'exterior', 'vistas' => 'vistas', 'obranueva' => 'obra-nueva', 'reformado' => 'reformado', 'jardin' => 'jardin', 'aire' => 'aire-acondicionado'] as $src => $slug) {
			if (!empty($it[$src])) $features[] = $slug;
		}
		wp_set_object_terms($id, $features, 'features');

		self::sync_photos($id, (array) ($it['fotos'] ?? []));
		return $existing ? 'updated' : 'created';
	}

	/** Descarga fotos nuevas (por URL) a la mediateca; reutiliza las ya importadas. WordPress genera los tamaños responsive (y WebP/AVIF según servidor). */
	private static function sync_photos(int $post_id, array $urls): void {
		if (!$urls) return;
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$ids = [];
		foreach (array_slice($urls, 0, 40) as $url) {
			$url = esc_url_raw(is_array($url) ? ($url['url'] ?? '') : $url);
			if (!$url) continue;
			$found = get_posts(['post_type' => 'attachment', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_albor_src', 'meta_value' => $url]);
			if ($found) { $ids[] = $found[0]; continue; }
			$att = media_sideload_image($url, $post_id, null, 'id');
			if (!is_wp_error($att)) { update_post_meta($att, '_albor_src', $url); $ids[] = $att; }
		}
		update_post_meta($post_id, 'gallery', $ids);
		if ($ids) set_post_thumbnail($post_id, $ids[0]);
	}

	/** Alta de la solicitud como demanda/contacto en Inmovilla (endpoint a definir con la firma). */
	public static function push_lead(array $data): void {
		if (!defined('ALBOR_INMOVILLA_LEADS_URL')) return;
		wp_remote_post(ALBOR_INMOVILLA_LEADS_URL, ['timeout' => 20, 'blocking' => false, 'headers' => ['Content-Type' => 'application/json'] + (defined('ALBOR_INMOVILLA_TOKEN') ? ['Authorization' => 'Bearer ' . ALBOR_INMOVILLA_TOKEN] : []), 'body' => wp_json_encode($data)]);
	}

	public static function screen(): void {
		$last = get_option('albor_last_sync');
		echo '<div class="wrap"><h1>Albor · Sincronización con Inmovilla</h1>';
		echo '<p>Estado: ' . (defined('ALBOR_INMOVILLA_URL') ? 'configurado' : '<strong>falta ALBOR_INMOVILLA_URL en wp-config.php</strong>') . '</p>';
		if ($last) echo '<p>Última sincronización: ' . esc_html(wp_json_encode($last)) . '</p>';
		echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="albor_sync_now">';
		wp_nonce_field('albor_sync_now');
		submit_button('Sincronizar ahora');
		echo '</form></div>';
	}
}
