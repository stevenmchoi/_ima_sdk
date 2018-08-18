const videoContent = document.getElementById('contentElement');

// Add pre-roll and mid-roll button listeners
const preRollPlayButton = document.getElementById('preRollPlayButton');
preRollPlayButton.addEventListener('click', () => playButtonClick(preRollAdsRequest));
const midRollPlayButton = document.getElementById('midRollPlayButton');
midRollPlayButton.addEventListener('click', () => playButtonClick(midRollAdsRequest));

// Add video listener to make default as pre-roll
videoContent.addEventListener('click', () => {
  if (!videoContent.controls) {
    playButtonClick(preRollAdsRequest);
  }
});

//// Set up IMA

// Create ad display container with SDK
const adContainer = document.getElementById('adContainer');
const adDisplayContainer = new google.ima.AdDisplayContainer(
  adContainer, videoContent
);

// Create ad loader out of container
const adsLoader = new google.ima.AdsLoader(adDisplayContainer);

// Listen to ad loading and error events
adsLoader.addEventListener(
  google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
  onAdsManagerLoaded,
  false
);
adsLoader.addEventListener(
  google.ima.AdErrorEvent.Type.AD_ERROR,
  onAdError,
  false
);

// Request pre-roll ad
const preRollAdsRequest = new google.ima.AdsRequest();
preRollAdsRequest.adsResponse = `<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">
<vmap:AdBreak timeOffset="start" breakType="linear" breakId="preroll">
<vmap:AdSource id="preroll-ad-1" allowMultipleAds="false" followRedirects="true">
<vmap:AdTagURI templateType="vast3">
<![CDATA[
https://pubads.g.doubleclick.net/gampad/ads?slotname=/124319096/external/ad_rule_samples&sz=640x480&ciu_szs=300x250&unviewed_position_start=1&output=xml_vast3&impl=s&env=vp&gdfp_req=1&ad_rule=0&vad_type=linear&vpos=preroll&pod=1&ppos=1&lip=true&min_ad_duration=0&max_ad_duration=30000&vrid=5776&cust_params=deployment%3Ddevsite%26sample_ar%3Dpreonly&url=https://developers.google.com/interactive-media-ads/docs/sdks/html5/tags&video_doc_id=short_onecue&cmsid=496&kfa=0&tfcd=0
]]>
</vmap:AdTagURI>
</vmap:AdSource>
</vmap:AdBreak>
< /vmap:VMAP>`;

// Request mid-roll ad
const midRollAdsRequest = new google.ima.AdsRequest();
midRollAdsRequest.adsResponse = `<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">
<vmap:AdBreak timeOffset="00:00:10.000" breakType="linear" breakId="midroll-1">
<vmap:AdSource id="midroll-1-ad-1" allowMultipleAds="false" followRedirects="true">
<vmap:AdTagURI templateType="vast3">
<![CDATA[
https://pubads.g.doubleclick.net/gampad/ads?slotname=/124319096/external/ad_rule_samples&sz=640x480&ciu_szs=300x250&unviewed_position_start=1&output=xml_vast3&impl=s&env=vp&gdfp_req=1&ad_rule=0&cue=15000&vad_type=linear&vpos=midroll&pod=2&mridx=1&ppos=1&lip=true&min_ad_duration=0&max_ad_duration=30000&vrid=6256&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpost&url=https://developers.google.com/interactive-media-ads/docs/sdks/html5/tags&video_doc_id=short_onecue&cmsid=496&kfa=0&tfcd=0
]]>
</vmap:AdTagURI>
</vmap:AdSource>
</vmap:AdBreak>
</vmap:VMAP>`;

// Add dimensions for both ad requests
function addAdDimens(adsRequest) {
  adsRequest.linearAdSlotWidth = 640;
  adsRequest.linearAdSlotHeight = 360;
  adsRequest.nonLinearAdSlotWidth = 640;
  adsRequest.nonLinearAdSlotHeight = 120;
}
addAdDimens(preRollAdsRequest);
addAdDimens(midRollAdsRequest);

// Event listeners to ad playing buttons
function playButtonClick(adsRequest) {
  // Destroy current ad manager to refresh
  adsLoader.contentComplete();
  if (adsManager) {
    adsManager.destroy();
  }
  videoContent.load();
  videoContent.controls = true;
  videoContent.volume = 0.2;
  adDisplayContainer.initialize();
  adsLoader.requestAds(adsRequest);
}

// End ad loader when video content is complete
const onContentEnded = function () {
  adsLoader.contentComplete();
  videoContent.controls = false;
};
videoContent.addEventListener('ended', onContentEnded);

// Create ads manager to tell loader if the manager was loaded
// or there was an error
let adsManager;

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Keep user settings for video
  var adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

  adsManager = adsManagerLoadedEvent.getAdsManager(
    videoContent, adsRenderingSettings
  );

  // Manage for errors, when video is paused for ad, and when
  // video resumes after ad
  adsManager.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError
  );
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
    onContentPauseRequested
  );
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    onContentResumeRequested
  );

  // Ad manager covers entire video
  adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
  adsManager.start();
}

// Simply play video without ad manager running
function onAdError(adErrorEvent) {
  console.log(adErrorEvent.getError());
  if (adsManager) {
    adsManager.destroy();
  }
  videoContent.play();
}

// To allow for video and buttons to both be clickable,
// hide and display ad container when appropriate
function onContentPauseRequested() {
  adContainer.style.display = 'initial';
  videoContent.removeEventListener('ended', onContentEnded);
  videoContent.pause();
}

function onContentResumeRequested() {
  adContainer.style.display = 'none';
  videoContent.addEventListener('ended', onContentEnded);
  videoContent.play();
}