<?php
/**
 * Plugin Name: Airwave Player
 * Description: Commercial-grade radio player with Lifeboat Protection and Smart Navigation.
 * Version: 2.9.0
 * Author: WP Radio Architect
 * Text Domain: airwave-player
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Airwave_Player_Core {
    public function __construct() {
        new Airwave_API();
        new Airwave_Player();
        add_action( 'admin_menu', [ $this, 'add_admin_menu' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
    }

    public function add_admin_menu() {
        add_menu_page('Airwave Player', 'Airwave Player', 'manage_options', 'airwave-player', [ $this, 'render_settings_page' ], 'dashicons-format-audio', 80);
    }

    public function register_settings() {
        register_setting( 'airwave_options', 'airwave_settings', [ $this, 'sanitize_settings' ] );

        add_settings_section( 'airwave_data', 'Stream Data', null, 'airwave-player' );
        add_settings_field( 'airwave_stream', 'Stream URL', [ $this, 'render_input' ], 'airwave-player', 'airwave_data', [ 'f' => 'stream_url' ] );
        add_settings_field( 'airwave_meta', 'Metadata URL', [ $this, 'render_input' ], 'airwave-player', 'airwave_data', [ 'f' => 'feed_url' ] );
        add_settings_field( 'airwave_hist', 'History URL', [ $this, 'render_input' ], 'airwave-player', 'airwave_data', [ 'f' => 'history_url' ] );
        add_settings_field( 'airwave_logo', 'Default Logo', [ $this, 'render_input' ], 'airwave-player', 'airwave_data', [ 'f' => 'default_image' ] );

        add_settings_section( 'airwave_pjax', 'Seamless Playback', null, 'airwave-player' );
        add_settings_field( 'airwave_enable_pjax', 'Enable Seamless Mode', [ $this, 'render_checkbox' ], 'airwave-player', 'airwave_pjax', [ 'f' => 'enable_pjax', 'desc' => 'Prevents page reloads so audio keeps playing.' ] );

        add_settings_section( 'airwave_visual', 'Visuals', null, 'airwave-player' );
        add_settings_field( 'airwave_bar_bg', 'Bar Background', [ $this, 'render_color' ], 'airwave-player', 'airwave_visual', [ 'f' => 'bar_bg', 'default' => '#000000' ] );
        add_settings_field( 'airwave_text_col', 'Text Color', [ $this, 'render_color' ], 'airwave-player', 'airwave_visual', [ 'f' => 'text_color', 'default' => '#ffffff' ] );
        add_settings_field( 'airwave_btn_bg', 'Popout Button Color', [ $this, 'render_color' ], 'airwave-player', 'airwave_visual', [ 'f' => 'btn_bg', 'default' => '#ffffff' ] );
        add_settings_field( 'airwave_btn_txt', 'Popout Text Color', [ $this, 'render_color' ], 'airwave-player', 'airwave_visual', [ 'f' => 'btn_text_color', 'default' => '#000000' ] );
        add_settings_field( 'airwave_btn_lbl', 'Popout Label', [ $this, 'render_input' ], 'airwave-player', 'airwave_visual', [ 'f' => 'btn_label', 'placeholder' => 'Listen Live' ] );
    }

    public function sanitize_settings( $input ) {
        $sanitized = [];
        
        // Sanitize URLs
        if ( isset( $input['stream_url'] ) ) {
            $sanitized['stream_url'] = esc_url_raw( $input['stream_url'] );
        }
        if ( isset( $input['feed_url'] ) ) {
            $sanitized['feed_url'] = esc_url_raw( $input['feed_url'] );
        }
        if ( isset( $input['history_url'] ) ) {
            $sanitized['history_url'] = esc_url_raw( $input['history_url'] );
        }
        if ( isset( $input['default_image'] ) ) {
            $sanitized['default_image'] = esc_url_raw( $input['default_image'] );
        }
        
        // Sanitize checkbox
        if ( isset( $input['enable_pjax'] ) ) {
            $sanitized['enable_pjax'] = '1';
        } else {
            $sanitized['enable_pjax'] = '0';
        }
        
        // Sanitize colors (validate hex)
        foreach ( [ 'bar_bg', 'text_color', 'btn_bg', 'btn_text_color' ] as $color_field ) {
            if ( isset( $input[ $color_field ] ) ) {
                $color = sanitize_text_field( $input[ $color_field ] );
                // Validate hex color
                if ( preg_match( '/^#[a-f0-9]{6}$/i', $color ) ) {
                    $sanitized[ $color_field ] = $color;
                }
            }
        }
        
        // Sanitize text field
        if ( isset( $input['btn_label'] ) ) {
            $sanitized['btn_label'] = sanitize_text_field( $input['btn_label'] );
        }
        
        return $sanitized;
    }

    public function render_input( $args ) {
        $opts = get_option( 'airwave_settings' );
        $val = isset( $opts[ $args['f'] ] ) ? $opts[ $args['f'] ] : '';
        $ph = $args['placeholder'] ?? '';
        echo '<input type="text" name="airwave_settings[' . esc_attr( $args['f'] ) . ']" value="' . esc_attr( $val ) . '" placeholder="'.esc_attr($ph).'" class="regular-text" style="width:100%; max-width:400px;">';
        if(isset($args['desc'])) echo '<p class="description">' . $args['desc'] . '</p>';
    }

    public function render_checkbox( $args ) {
        $opts = get_option( 'airwave_settings' );
        $val = isset( $opts[ $args['f'] ] ) ? $opts[ $args['f'] ] : '0';
        echo '<input type="checkbox" name="airwave_settings[' . esc_attr( $args['f'] ) . ']" value="1" ' . checked( $val, '1', false ) . '> ' . $args['desc'];
    }

    public function render_color( $args ) {
        $opts = get_option( 'airwave_settings' );
        $val = isset( $opts[ $args['f'] ] ) ? $opts[ $args['f'] ] : $args['default'];
        echo '<input type="color" name="airwave_settings[' . esc_attr( $args['f'] ) . ']" value="' . esc_attr( $val ) . '">';
    }

    public function render_settings_page() {
        echo '<div class="wrap"><h1>Airwave Player Settings</h1><form action="options.php" method="post">';
        settings_fields( 'airwave_options' );
        do_settings_sections( 'airwave-player' );
        submit_button();
        echo '</form></div>';
    }
}

class Airwave_API {
    public function __construct() {
        add_action( 'rest_api_init', function() {
            register_rest_route( 'airwave/v1', '/now-playing', [ 'methods' => 'GET', 'callback' => [ $this, 'get_now_playing' ], 'permission_callback' => '__return_true' ] );
            register_rest_route( 'airwave/v1', '/history', [ 'methods' => 'GET', 'callback' => [ $this, 'get_history' ], 'permission_callback' => '__return_true' ] );
        });
    }
    public function get_now_playing() {
        $data = get_transient( 'airwave_now_playing' );
        if ( false === $data ) { $data = $this->fetch_current(); set_transient( 'airwave_now_playing', $data, 10 ); }
        return rest_ensure_response( $data );
    }
    public function get_history() {
        $data = get_transient( 'airwave_history_data' );
        if ( false === $data ) { $data = $this->fetch_history(); set_transient( 'airwave_history_data', $data, 30 ); }
        return rest_ensure_response( $data );
    }
    private function fetch_current() {
        $opts = get_option( 'airwave_settings' );
        $track = [ 'artist' => 'Airwave Player', 'title' => 'Live Radio', 'cover' => $opts['default_image'] ?? '' ];
        $xml = $this->req($opts['feed_url'] ?? '');
        if ($xml) {
            if(!empty($xml->title)) $track['title'] = $this->clean_str((string)$xml->title);
            if(!empty($xml->artist)) $track['artist'] = (string)$xml->artist;
            if(!empty($xml->cover) && filter_var((string)$xml->cover, FILTER_VALIDATE_URL)) $track['cover'] = str_replace('http://','https://',(string)$xml->cover);
        }
        return $track;
    }
    private function fetch_history() {
        $opts = get_option( 'airwave_settings' );
        $hist = [];
        $xml = $this->req($opts['history_url'] ?? '');
        if ($xml && isset($xml->song)) {
            $count = 0;
            foreach ($xml->song as $s) {
                if ($count === 0) {
                    $count++;
                    continue; 
                }
                if ($count >= 7) break;
                $item = [ 'title' => $this->clean_str((string)$s->title), 'artist' => (string)$s->artist, 'cover' => $opts['default_image'] ?? '' ];
                if(!empty($s->cover) && filter_var((string)$s->cover, FILTER_VALIDATE_URL)) $item['cover'] = str_replace('http://','https://',(string)$s->cover);
                $hist[] = $item;
                $count++;
            }
        }
        return $hist;
    }
    private function clean_str($str) {
        $str = trim($str);
        $max_length = 60;
        if (mb_strlen($str, 'UTF-8') > $max_length) {
            return mb_substr($str, 0, $max_length, 'UTF-8') . '...';
        }
        return $str;
    }
    private function req($url) {
        if(empty($url)) return false;
        $res = wp_remote_get($url, ['timeout'=>10,'user-agent'=>'Mozilla/5.0']);
        if(is_wp_error($res) || 200!==wp_remote_retrieve_response_code($res)) return false;
        $body = trim(wp_remote_retrieve_body($res));
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body);
        if(!$xml) $xml = simplexml_load_string(str_replace('&','&amp;',$body));
        libxml_clear_errors();
        return $xml;
    }
}

class Airwave_Player {
    public function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'inject_assets' ] );
        add_action( 'wp_footer', [ $this, 'render_bar' ] );
        add_action( 'wp_ajax_airwave_popout', [ $this, 'render_popout' ] );
        add_action( 'wp_ajax_nopriv_airwave_popout', [ $this, 'render_popout' ] );
    }

    public function inject_assets() {
        wp_register_style( 'airwave-css', false ); wp_enqueue_style( 'airwave-css' );
        
        $opts = get_option('airwave_settings');
        // CSS
        $css = ":root{ --airwave-bar:".($opts['bar_bg']??'#000')."; --airwave-txt:".($opts['text_color']??'#fff')."; --airwave-btn-bg:".($opts['btn_bg']??'#fff')."; --airwave-btn-txt:".($opts['btn_text_color']??'#000')."; }";
        $css .= "
        #airwave-sticky-bar { position:fixed; bottom:0; left:0; width:100%; height:80px; background:var(--airwave-bar); border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center; padding:0 30px; box-sizing:border-box; z-index:2147483647; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; box-shadow:0 -5px 20px rgba(0,0,0,0.3); }
        .airwave-left-group { display:flex; align-items:center; flex-grow:1; overflow:hidden; margin-right:20px; }
        #airwave-bar-play { width:45px; height:45px; border-radius:50%; border:2px solid rgba(255,255,255,0.2); background:transparent; color:var(--airwave-txt); display:flex; align-items:center; justify-content:center; cursor:pointer; margin-right:20px; flex-shrink:0; transition:all 0.2s; }
        #airwave-bar-play:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.5); transform:scale(1.05); }
        #airwave-bar-play svg { width:18px; height:18px; fill:currentColor; margin-left:2px; }
        #airwave-bar-play.playing svg { margin-left:0; }
        .airwave-meta { display:flex; align-items:center; overflow:hidden; }
        #airwave-cover { width:50px; height:50px; border-radius:6px; margin-right:15px; background:#333; object-fit:cover; flex-shrink:0; }
        .airwave-text { display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
        #airwave-title { font-weight:700; font-size:15px; color:var(--airwave-txt); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
        #airwave-artist { font-size:13px; color:var(--airwave-txt); opacity:0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
        #airwave-popout-btn { background:var(--airwave-btn-bg); color:var(--airwave-btn-txt); border:none; padding:12px 24px; border-radius:50px; font-weight:700; font-size:13px; cursor:pointer; text-transform:uppercase; letter-spacing:0.5px; transition:transform 0.2s; white-space:nowrap; }
        #airwave-popout-btn:hover { transform:scale(1.03); opacity:0.9; }
        @media(max-width:600px){ #airwave-artist{display:none;} #airwave-sticky-bar{padding:0 15px; height:70px;} #airwave-bar-play{width:40px;height:40px;margin-right:12px;} #airwave-cover{width:40px;height:40px;margin-right:10px;} }
        ";
        wp_add_inline_style( 'airwave-css', $css );

        // JS Logic
        $pjax_enabled = isset($opts['enable_pjax']) && $opts['enable_pjax'] == '1';

        $js = 'var Airwave_Data = '.wp_json_encode([
            'api_now' => get_rest_url(null,'airwave/v1/now-playing'),
            'popout_url' => admin_url('admin-ajax.php?action=airwave_popout'),
            'stream' => $opts['stream_url'] ?? '',
            'pjax' => $pjax_enabled
        ]).';';
        
        // v2.9.0 SAFE JS: Standard strings, no heredoc. Added Lifeboat and wp-site-blocks selector.
        $js .= "
        jQuery(document).ready(function($){
            
            // 1. LIFEBOAT: Move player to body to survive block theme updates
            if($('#airwave-sticky-bar').length) { $('#airwave-sticky-bar').appendTo('body'); }

            var audio = document.getElementById('airwave-bar-audio');
            var btn = document.getElementById('airwave-bar-play');
            var iPlay = $('#icon-bar-play'), iPause = $('#icon-bar-pause');
            var isPlaying = false;

            // Play Logic
            function updBtn(){ 
                if(isPlaying){ iPlay.hide(); iPause.show(); $(btn).addClass('playing'); } 
                else { iPlay.show(); iPause.hide(); $(btn).removeClass('playing'); } 
            }
            if(btn){
                btn.onclick = function(){
                    if(audio.paused){ audio.play(); isPlaying=true; } else { audio.pause(); isPlaying=false; }
                    updBtn();
                };
            }

            // Metadata
            function poll(){
                $.get(Airwave_Data.api_now, function(d){
                    if(d.title){
                        $('#airwave-title').text(d.title);
                        $('#airwave-artist').text(d.artist);
                        if(d.cover && d.cover!=='') $('#airwave-cover').attr('src',d.cover).show(); else $('#airwave-cover').hide();
                        updateMediaSession(d);
                    }
                });
            }
            poll(); setInterval(poll, 15000);

            // Media Session API Integration
            function updateMediaSession(data) {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: data.title || 'Live Radio',
                        artist: data.artist || 'Airwave Player',
                        album: 'Live Stream',
                        artwork: data.cover ? [
                            { src: data.cover, sizes: '512x512' },
                            { src: data.cover, sizes: '256x256' },
                            { src: data.cover, sizes: '128x128' }
                        ] : []
                    });
                }
            }

            // Register Media Session action handlers once
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('play', function() {
                    audio.play();
                    isPlaying = true;
                    updBtn();
                });

                navigator.mediaSession.setActionHandler('pause', function() {
                    audio.pause();
                    isPlaying = false;
                    updBtn();
                });
            }

            // Popout
            $('#airwave-popout-btn').on('click', function(e){
                e.preventDefault();
                audio.pause(); isPlaying=false; updBtn();
                window.open(Airwave_Data.popout_url + '&airwave_popout_mode=1', 'AirwavePlayer', 'width=420,height=700,menubar=no,toolbar=no');
            });

            // SMART SEAMLESS NAVIGATION
            if(Airwave_Data.pjax) {
                var selectors = ['#main', 'main', '.wp-site-blocks', '#content', '.site-content', '#primary', '.content-area', '#page', '.page-wrapper'];
                var activeContainer = '';

                for(var i=0; i<selectors.length; i++) {
                    if($(selectors[i]).length) { activeContainer = selectors[i]; break; }
                }

                if(activeContainer) {
                    console.log('Airwave: Seamless Mode locked onto: ' + activeContainer);
                    $(document).on('click', 'a', function(e){
                        var href = $(this).attr('href');
                        if(!href || href.indexOf(window.location.origin) === -1 || href.indexOf('/wp-admin') > -1 || href.indexOf('#') > -1 || $(this).attr('target') === '_blank') return;
                        
                        e.preventDefault();
                        $.get(href, function(html){
                            var doc = new DOMParser().parseFromString(html, 'text/html');
                            var newContent = doc.querySelector(activeContainer);
                            if(newContent) {
                                $(activeContainer).html(newContent.innerHTML);
                                document.title = doc.title;
                                window.history.pushState({}, '', href);
                                window.scrollTo(0,0);
                                $(document.body).trigger('post-load');
                            } else { window.location = href; }
                        }).fail(function(){ window.location = href; });
                    });
                    window.onpopstate = function(){ location.reload(); }; 
                }
            }
        });
        ";
        wp_enqueue_script( 'jquery' );
        wp_add_inline_script( 'jquery', $js );
    }

    public function render_bar() {
        // Skip rendering in popout mode (standalone window)
        if(isset($_GET['airwave_popout_mode']) && '1' === sanitize_text_field($_GET['airwave_popout_mode'])) return;
        $opts = get_option('airwave_settings');
        $lbl = $opts['btn_label'] ?? 'Listen Live';
        ?>
        <div id="airwave-sticky-bar">
            <div class="airwave-left-group">
                <button id="airwave-bar-play">
                    <svg id="icon-bar-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="icon-bar-pause" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <div class="airwave-meta">
                    <img id="airwave-cover" src="" style="display:none;">
                    <div class="airwave-text"><span id="airwave-title">Loading...</span><span id="airwave-artist">Airwave Player</span></div>
                </div>
            </div>
            <button id="airwave-popout-btn"><?php echo esc_html($lbl); ?></button>
            <audio id="airwave-bar-audio" src="<?php echo esc_url($opts['stream_url']??''); ?>" preload="none"></audio>
        </div>
        <?php
    }

    public function render_popout() {
        $opts = get_option('airwave_settings');
        $api_now = esc_js( get_rest_url(null,'airwave/v1/now-playing') );
        $api_hist = esc_js( get_rest_url(null,'airwave/v1/history') );
        ?>
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Live Player</title>
        <style>body{background:#121212;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:30px;display:flex;flex-direction:column;align-items:center;height:100vh;box-sizing:border-box;overflow:hidden;} 
        .player-wrap{text-align:center;margin-bottom:20px;width:100%;max-width:350px;display:flex;flex-direction:column;align-items:center;flex-shrink:0} 
        #p-cover{width:260px;height:260px;border-radius:16px;margin-bottom:25px;box-shadow:0 15px 40px rgba(0,0,0,0.6);object-fit:cover;background:#222;display:none} 
        h2{margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block} 
        h3{margin:0 0 25px;font-size:18px;color:#bbb;font-weight:400;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block} 
        #play-btn{width:70px;height:70px;border-radius:50%;background:#fff;color:#000;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s;box-shadow:0 5px 15px rgba(255,255,255,.2);margin-top:10px;flex-shrink:0} 
        #play-btn:hover{transform:scale(1.05)} #play-btn svg{width:28px;height:28px;fill:currentColor} 
        /* FIXED SCROLLING CONTAINER */
        .h-lbl{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#666;margin-bottom:15px;width:100%;max-width:350px;text-align:left;border-bottom:1px solid #333;padding-bottom:8px;font-weight:700;margin-top:10px;flex-shrink:0} 
        #h-list{width:100%;max-width:350px;list-style:none;padding:0;margin:0;flex-grow:1;overflow-y:auto;min-height:0;} 
        .h-item{display:flex;align-items:center;margin-bottom:15px;padding:10px;border-radius:10px;background:rgba(255,255,255,.03)} 
        .h-thumb{width:55px;height:55px;border-radius:6px;margin-right:15px;object-fit:cover;background:#222;flex-shrink:0} 
        .h-info{display:flex;flex-direction:column;overflow:hidden;width:100%} 
        .h-title{font-size:16px;font-weight:600;color:#eee;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block} 
        .h-artist{font-size:14px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block} 
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:#444;border-radius:3px}</style>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        </head>
        <body>
        <div class="player-wrap">
            <img id="p-cover" src="" alt="">
            <h2 id="p-title">Connecting...</h2>
            <h3 id="p-artist">Please wait</h3>
            <audio id="audio" src="<?php echo esc_url($opts['stream_url']??''); ?>" preload="auto"></audio>
            <button id="play-btn">
                <svg id="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="icon-pause" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
        </div>
        <div class="h-lbl">Recently Played</div>
        <ul id="h-list"></ul>
        <script>
        var apiNow = "<?php echo $api_now; ?>";
        var apiHist = "<?php echo $api_hist; ?>";
        var audio = document.getElementById('audio');
        var btn = document.getElementById('play-btn');
        var iPlay = document.getElementById('icon-play');
        var iPause = document.getElementById('icon-pause');
        var isPlaying = false;
        
        function upd() {
            if (isPlaying) {
                iPlay.style.display = 'none';
                iPause.style.display = 'block';
            } else {
                iPlay.style.display = 'block';
                iPause.style.display = 'none';
            }
        }
        
        function attemptPlay() {
            var a = audio.play();
            if (a !== undefined) {
                a.then(_ => {
                    isPlaying = true;
                    upd();
                }).catch(e => {
                    isPlaying = false;
                    upd();
                });
            }
        }
        
        btn.onclick = function() {
            if (audio.paused) {
                audio.play();
                isPlaying = true;
            } else {
                audio.pause();
                isPlaying = false;
            }
            upd();
        };
        
        attemptPlay();
        
        function updateMediaSession(data) {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: data.title || 'Live Radio',
                    artist: data.artist || 'Airwave Player',
                    album: 'Live Stream',
                    artwork: data.cover ? [
                        { src: data.cover, sizes: '512x512' },
                        { src: data.cover, sizes: '256x256' },
                        { src: data.cover, sizes: '128x128' }
                    ] : []
                });
            }
        }

        // Register Media Session action handlers once
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', function() {
                audio.play();
                isPlaying = true;
                upd();
            });

            navigator.mediaSession.setActionHandler('pause', function() {
                audio.pause();
                isPlaying = false;
                upd();
            });
        }
        
        function ref() {
            $.get(apiNow, function(d) {
                if (d.title) {
                    $('#p-title').text(d.title);
                    $('#p-artist').text(d.artist);
                    if (d.cover && d.cover !== '') {
                        $('#p-cover').attr('src', d.cover).fadeIn();
                    } else {
                        $('#p-cover').hide();
                    }
                    document.title = '▶ ' + d.title;
                    updateMediaSession(d);
                }
            });
            
            $.get(apiHist, function(d) {
                var l = $('#h-list');
                l.empty();
                if (d.length > 0) {
                    d.forEach(function(s) {
                        var item = $('<li>').addClass('h-item');
                        var thumb = $('<img>').addClass('h-thumb').attr('src', s.cover);
                        var info = $('<div>').addClass('h-info');
                        var title = $('<span>').addClass('h-title').text(s.title);
                        var artist = $('<span>').addClass('h-artist').text(s.artist);
                        info.append(title).append(artist);
                        item.append(thumb).append(info);
                        l.append(item);
                    });
                }
            });
        }
        
        ref();
        setInterval(ref, 15000);
        </script>
        </body>
        </html>
        <?php
        exit;
    }
}

// Initialize after all classes are defined
add_action( 'plugins_loaded', function() {
    new Airwave_Player_Core();
});
