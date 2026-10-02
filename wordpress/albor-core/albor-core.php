<?php
/**
 * Plugin Name: Albor Core
 * Description: Modelo de datos inmobiliario de Albor: CPT "property", taxonomías, campos estructurados, API REST (/albor/v1), SEO (schema.org, Open Graph, canonical, sitemap) y sincronización con Inmovilla. El contenido inmobiliario queda separado del tema.
 * Version: 0.1.0
 * Requires PHP: 8.0
 * Text Domain: albor
 */

defined('ABSPATH') || exit;

define('ALBOR_CORE_DIR', plugin_dir_path(__FILE__));
require_once ALBOR_CORE_DIR . 'includes/class-inmovilla-sync.php';

final class Albor_Core {

	/** Campos estructurados (post meta). Tipos usados para register_post_meta y para el mapeo de Inmovilla. */
	const META = [
		'reference'   => 'string',   // Referencia Inmovilla (clave única de sincronización)
		'price'       => 'number',
		'price_period'=> 'string',   // '' | 'mes'
		'surface'     => 'number',   // m² construidos
		'plot'        => 'number',   // m² parcela
		'rooms'       => 'integer',
		'bathrooms'   => 'integer',
		'terrace'     => 'number',   // m² terraza (0 = sin terraza)
		'garage'      => 'integer',  // nº plazas
		'floor'       => 'string',
		'year_built'  => 'integer',
		'energy'      => 'string',
		'lat'         => 'number',
		'lng'         => 'number',
		'gallery'     => 'array',    // IDs de adjuntos, en orden
		'video'       => 'string',   // URL
		'plan'        => 'integer',  // ID de adjunto del plano
		'agent'       => 'string',
		'status'      => 'string',   // disponible | reservado | vendido | alquilado
		'excerpt_ed'  => 'string',   // entradilla editorial
		'inmovilla_hash' => 'string',// huella de la última sincronización
	];

	const TAX = [
		'operation'     => ['Operación', 'Operaciones', 'propiedades', true],   // venta | alquiler
		'property_type' => ['Tipo', 'Tipos', 'tipo', true],                    // piso, atico, chalet…
		'location'      => ['Municipio', 'Municipios', 'municipio', true],     // Valencia, Godella…
		'zone'          => ['Zona', 'Zonas', 'zona', true],                    // pla-del-remei, ruzafa…
		'features'      => ['Característica', 'Características', 'caracteristica', false],
	];

	public static function init(): void {
		add_action('init', [__CLASS__, 'register']);
		add_action('init', [__CLASS__, 'rewrites']);
		add_filter('post_type_link', [__CLASS__, 'permalink'], 10, 2);
		add_action('rest_api_init', [__CLASS__, 'rest']);
		add_action('wp_head', [__CLASS__, 'head_seo'], 5);
		add_filter('wp_sitemaps_taxonomies', fn($t) => array_intersect_key($t, array_flip(['operation', 'property_type', 'zone'])));
		Albor_Inmovilla_Sync::init();
	}

	public static function register(): void {
		register_post_type('property', [
			'labels'       => ['name' => 'Propiedades', 'singular_name' => 'Propiedad', 'add_new_item' => 'Añadir propiedad'],
			'public'       => true,
			'show_in_rest' => true,
			'menu_icon'    => 'dashicons-admin-home',
			'supports'     => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions'],
			'has_archive'  => 'propiedades',
			'rewrite'      => ['slug' => 'propiedad', 'with_front' => false],
		]);
		foreach (self::TAX as $tax => [$s, $p, $slug, $hier]) {
			register_taxonomy($tax, 'property', [
				'labels'            => ['name' => $p, 'singular_name' => $s],
				'hierarchical'      => $hier,
				'show_in_rest'      => true,
				'show_admin_column' => in_array($tax, ['operation', 'property_type', 'zone'], true),
				'rewrite'           => ['slug' => $slug, 'with_front' => false],
			]);
		}
		foreach (self::META as $key => $type) {
			register_post_meta('property', $key, [
				'type'         => $type,
				'single'       => true,
				'show_in_rest' => $type === 'array' ? ['schema' => ['type' => 'array', 'items' => ['type' => 'integer']]] : true,
				'auth_callback'=> fn() => current_user_can('edit_posts'),
			]);
		}
	}

	/**
	 * URLs SEO jerárquicas:
	 *   /propiedades/venta/                       operación
	 *   /propiedades/venta/aticos/                operación × tipo
	 *   /propiedades/venta/aticos/pla-del-remei/  operación × tipo × zona
	 *   /propiedades/venta/zona/ruzafa/           operación × zona
	 *   /propiedad/{slug}-{ref}/                  ficha
	 */
	public static function rewrites(): void {
		add_rewrite_rule('^propiedades/(venta|alquiler)/zona/([^/]+)/?$', 'index.php?post_type=property&operation=$matches[1]&zone=$matches[2]', 'top');
		add_rewrite_rule('^propiedades/(venta|alquiler)/([^/]+)/([^/]+)/?$', 'index.php?post_type=property&operation=$matches[1]&property_type=$matches[2]&zone=$matches[3]', 'top');
		add_rewrite_rule('^propiedades/(venta|alquiler)/([^/]+)/?$', 'index.php?post_type=property&operation=$matches[1]&property_type=$matches[2]', 'top');
		add_rewrite_rule('^propiedades/(venta|alquiler)/?$', 'index.php?post_type=property&operation=$matches[1]', 'top');
	}

	public static function permalink(string $url, WP_Post $post): string {
		if ($post->post_type !== 'property') return $url;
		$ref = sanitize_title((string) get_post_meta($post->ID, 'reference', true));
		return $ref && !str_ends_with($post->post_name, $ref) ? home_url("/propiedad/{$post->post_name}-{$ref}/") : $url;
	}

	/* ---------------------------------------------------------------- REST */

	public static function rest(): void {
		register_rest_route('albor/v1', '/properties', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => [__CLASS__, 'rest_properties']]);
		register_rest_route('albor/v1', '/stats', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => [__CLASS__, 'rest_stats']]);
		register_rest_route('albor/v1', '/taxonomies', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => [__CLASS__, 'rest_taxonomies']]);
		register_rest_route('albor/v1', '/lead', ['methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => [__CLASS__, 'rest_lead']]);
	}

	/** Misma forma que assets/data/properties.json del prototipo: el frontend no cambia. */
	public static function to_array(WP_Post $p): array {
		$m = fn($k) => get_post_meta($p->ID, $k, true);
		$term = fn($t) => ($x = get_the_terms($p, $t)) && !is_wp_error($x) ? $x[0]->slug : null;
		$terms = fn($t) => ($x = get_the_terms($p, $t)) && !is_wp_error($x) ? wp_list_pluck($x, 'slug') : [];
		$gallery = array_map(fn($id) => wp_get_attachment_image_url((int) $id, 'large'), (array) ($m('gallery') ?: []));
		$loc = get_the_terms($p, 'location');
		return [
			'ref' => $m('reference'), 'demo' => false, 'slug' => $p->post_name, 'title' => get_the_title($p),
			'url' => get_permalink($p),
			'operation' => $term('operation'), 'type' => $term('property_type'), 'zone' => $term('zone'),
			'city' => $loc && !is_wp_error($loc) ? $loc[0]->name : 'Valencia',
			'price' => (float) $m('price'), 'rooms' => (int) $m('rooms'), 'baths' => (int) $m('bathrooms'),
			'surface' => (float) $m('surface'), 'plot' => $m('plot') ? (float) $m('plot') : null,
			'terrace' => $m('terrace') ? (float) $m('terrace') : null, 'garage' => $m('garage') ? (int) $m('garage') : null,
			'floor' => $m('floor') ?: null, 'year_built' => $m('year_built') ? (int) $m('year_built') : null,
			'status' => $m('status') ?: 'disponible', 'energy' => $m('energy') ?: null,
			'features' => $terms('features'),
			'lat' => (float) $m('lat'), 'lng' => (float) $m('lng'),
			'images' => array_values(array_filter($gallery)),
			'video' => $m('video') ?: null, 'plan' => $m('plan') ? wp_get_attachment_url((int) $m('plan')) : null, 'agent' => $m('agent') ?: null,
			'excerpt' => $m('excerpt_ed') ?: get_the_excerpt($p),
			'description' => array_values(array_filter(array_map('trim', preg_split('/\n\s*\n/', wp_strip_all_tags($p->post_content))))),
		];
	}

	private static function query(array $extra = []): array {
		return get_posts(array_merge([
			'post_type' => 'property', 'post_status' => 'publish', 'numberposts' => -1,
			'meta_query' => [['key' => 'status', 'value' => ['vendido', 'alquilado'], 'compare' => 'NOT IN']],
		], $extra));
	}

	public static function rest_properties(WP_REST_Request $r) {
		$tax = [];
		foreach (['operation' => 'op', 'property_type' => 'type', 'zone' => 'zone'] as $t => $q) {
			if ($v = $r->get_param($q)) $tax[] = ['taxonomy' => $t, 'field' => 'slug', 'terms' => explode(',', sanitize_text_field($v))];
		}
		$posts = self::query($tax ? ['tax_query' => $tax] : []);
		return rest_ensure_response(['_meta' => ['source' => 'inmovilla', 'count' => count($posts)], 'properties' => array_map([__CLASS__, 'to_array'], $posts)]);
	}

	/** Cifras SIEMPRE calculadas desde el inventario publicado. Caché de 10 min, invalidada al sincronizar. */
	public static function rest_stats() {
		$cached = get_transient('albor_stats');
		if ($cached) return rest_ensure_response($cached);
		$list = array_map([__CLASS__, 'to_array'], self::query());
		$by = function (string $k) use ($list) { $o = []; foreach ($list as $p) { $o[$p[$k]] = ($o[$p[$k]] ?? 0) + 1; } return $o; };
		$premium = (array) get_option('albor_premium_zones', []);
		$stats = [
			'total_properties' => count($list),
			'sale_properties' => count(array_filter($list, fn($p) => $p['operation'] === 'venta')),
			'rent_properties' => count(array_filter($list, fn($p) => $p['operation'] === 'alquiler')),
			'properties_by_city' => $by('city'),
			'properties_by_zone' => $by('zone'),
			'properties_by_type' => $by('type'),
			'premium_zone_properties' => count(array_filter($list, fn($p) => in_array($p['zone'], $premium, true))),
			'source' => 'inmovilla',
			'updated_at' => current_time('c'),
		];
		set_transient('albor_stats', $stats, 10 * MINUTE_IN_SECONDS);
		return rest_ensure_response($stats);
	}

	public static function rest_taxonomies() {
		$out = ['groups' => get_option('albor_zone_groups', []), 'zones' => [], 'types' => [], 'features' => []];
		foreach (get_terms(['taxonomy' => 'zone', 'hide_empty' => false]) as $t) {
			$out['zones'][] = ['slug' => $t->slug, 'name' => $t->name, 'blurb' => $t->description,
				'city' => get_term_meta($t->term_id, 'city', true) ?: 'Valencia', 'group' => get_term_meta($t->term_id, 'group', true),
				'lat' => (float) get_term_meta($t->term_id, 'lat', true), 'lng' => (float) get_term_meta($t->term_id, 'lng', true),
				'premium' => in_array($t->slug, (array) get_option('albor_premium_zones', []), true)];
		}
		foreach (get_terms(['taxonomy' => 'property_type', 'hide_empty' => false]) as $t) $out['types'][] = ['slug' => $t->slug, 'name' => $t->name, 'plural' => get_term_meta($t->term_id, 'plural', true) ?: $t->name];
		foreach (get_terms(['taxonomy' => 'features', 'hide_empty' => false]) as $t) $out['features'][] = ['slug' => $t->slug, 'name' => $t->name];
		return rest_ensure_response($out);
	}

	/** Leads de formularios → email a la firma + alta de demanda en Inmovilla. Requiere consentimiento. */
	public static function rest_lead(WP_REST_Request $r) {
		if (!$r->get_param('consent')) return new WP_Error('consent', 'Falta el consentimiento.', ['status' => 400]);
		if ($r->get_param('website')) return rest_ensure_response(['ok' => true]); // honeypot
		$email = sanitize_email((string) $r->get_param('email'));
		if (!is_email($email)) return new WP_Error('email', 'Email no válido.', ['status' => 400]);
		$data = array_map('sanitize_text_field', array_filter($r->get_params(), 'is_scalar'));
		wp_mail(get_option('albor_leads_email', get_option('admin_email')), 'Nuevo contacto web · ' . ($data['ref'] ?? $data['motivo'] ?? 'general'), print_r($data, true));
		Albor_Inmovilla_Sync::push_lead($data);
		return rest_ensure_response(['ok' => true]);
	}

	/* ---------------------------------------------------------------- SEO */

	public static function head_seo(): void {
		if (!is_singular('property')) return;
		$p = self::to_array(get_post());
		$type = ($t = get_the_terms(get_the_ID(), 'property_type')) && !is_wp_error($t) ? $t[0]->name : '';
		$desc = wp_trim_words("{$type} en {$p['operation']} en {$p['city']}: {$p['surface']} m², {$p['rooms']} habitaciones, {$p['baths']} baños. {$p['excerpt']}", 28);
		printf("<meta name=\"description\" content=\"%s\">\n", esc_attr($desc));
		printf("<meta property=\"og:type\" content=\"article\">\n<meta property=\"og:title\" content=\"%s\">\n<meta property=\"og:description\" content=\"%s\">\n", esc_attr($p['title']), esc_attr($desc));
		if (!empty($p['images'][0])) printf("<meta property=\"og:image\" content=\"%s\">\n", esc_url($p['images'][0]));
		$ld = [
			'@context' => 'https://schema.org', '@type' => 'RealEstateListing', 'name' => $p['title'], 'url' => $p['url'], 'image' => $p['images'],
			'offers' => ['@type' => 'Offer', 'price' => $p['price'], 'priceCurrency' => 'EUR'],
			'about' => ['@type' => in_array($p['type'], ['piso', 'atico'], true) ? 'Apartment' : 'SingleFamilyResidence',
				'numberOfRooms' => $p['rooms'], 'numberOfBathroomsTotal' => $p['baths'],
				'floorSize' => ['@type' => 'QuantitativeValue', 'value' => $p['surface'], 'unitCode' => 'MTK'],
				'address' => ['@type' => 'PostalAddress', 'addressLocality' => $p['city'], 'addressCountry' => 'ES'],
				// Coordenadas redondeadas: no se publica el portal exacto.
				'geo' => ['@type' => 'GeoCoordinates', 'latitude' => round($p['lat'], 3), 'longitude' => round($p['lng'], 3)]],
		];
		echo '<script type="application/ld+json">' . wp_json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "</script>\n";
	}
}

Albor_Core::init();

register_activation_hook(__FILE__, function () {
	Albor_Core::register();
	Albor_Core::rewrites();
	flush_rewrite_rules();
	if (!wp_next_scheduled('albor_inmovilla_sync')) wp_schedule_event(time() + 60, 'hourly', 'albor_inmovilla_sync');
});
register_deactivation_hook(__FILE__, function () {
	wp_clear_scheduled_hook('albor_inmovilla_sync');
	flush_rewrite_rules();
});
