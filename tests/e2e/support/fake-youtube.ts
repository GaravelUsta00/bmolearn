/**
 * YouTube IFrame API'sinin sahtesi. Testler YouTube'a bağlanmaz: ağdan bağımsız, hızlı ve
 * tekrarlanabilir olsun diye `https://www.youtube.com/iframe_api` bu betikle değiştirilir.
 * Uygulamanın kullandığı oynatıcı yöntemlerini taklit eder; durum değişikliklerini gerçek API
 * gibi `onStateChange` ile bildirir (1 oynuyor, 2 duraklatıldı, 5 hazır).
 *
 * Gerçek YouTube ile doğrulama: tests/e2e/README.md ("Gerçek YouTube").
 */
export const FAKE_YOUTUBE_API = String.raw`
(function () {
  var PLAYLIST = ['aaaaaaaaaa1', 'aaaaaaaaaa2', 'aaaaaaaaaa3'];
  function Player(el, opts) {
    var self = this;
    var target = typeof el === 'string' ? document.getElementById(el) : el;
    var div = document.createElement('div');
    div.id = target.id;
    div.setAttribute('data-fake-youtube', '');
    div.style.cssText = 'width:100%;height:100%;background:#111';
    target.replaceWith(div);
    var vars = opts.playerVars || {};
    var list = vars.list ? PLAYLIST.slice() : [];
    var index = 0;
    var videoId = opts.videoId || list[0] || '';
    var state = -1;
    var startedAt = 0;
    var offset = vars.start || 0;
    var muted = false;
    var ev = opts.events || {};
    function set(s) {
      if (s === 1) startedAt = Date.now();
      if (state === 1 && s !== 1) offset += (Date.now() - startedAt) / 1000;
      state = s;
      ev.onStateChange && ev.onStateChange({ target: self, data: s });
    }
    this.playVideo = function () { set(1); };
    this.pauseVideo = function () { set(2); };
    this.stopVideo = function () { set(5); };
    this.getPlayerState = function () { return state; };
    this.getCurrentTime = function () { return state === 1 ? offset + (Date.now() - startedAt) / 1000 : offset; };
    this.seekTo = function (t) { offset = t; startedAt = Date.now(); };
    this.getVideoData = function () { return { video_id: videoId, title: 'Sahte video ' + videoId }; };
    this.getPlaylist = function () { return list.length ? list.slice() : null; };
    this.getPlaylistIndex = function () { return index; };
    this.getPlaylistId = function () { return vars.list || null; };
    this.playVideoAt = function (i) { index = i; videoId = list[i]; offset = 0; set(1); };
    this.loadVideoById = function (a) { videoId = typeof a === 'string' ? a : a.videoId; offset = (a && a.startSeconds) || 0; set(1); };
    this.mute = function () { muted = true; };
    this.unMute = function () { muted = false; };
    this.isMuted = function () { return muted; };
    this.setVolume = function () {};
    this.getIframe = function () { return div; };
    this.destroy = function () { div.remove(); };
    setTimeout(function () {
      ev.onReady && ev.onReady({ target: self });
      if (vars.autoplay) set(1);
      else set(5);
    }, 30);
  }
  window.YT = { Player: Player, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };
  window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();
})();
`;
