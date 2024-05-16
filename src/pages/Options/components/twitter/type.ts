export interface TwitterResult {
  data: Data;
}

export interface Data {
  bookmark_timeline_v2: BookmarkTimelineV2;
}

export interface BookmarkTimelineV2 {
  timeline: Timeline;
}

export interface Timeline {
  instructions: Instruction[];
  responseObjects: ResponseObjects;
}

export interface Instruction {
  type: string;
  entries: Entry[];
}

export interface Entry {
  entryId: string;
  sortIndex: string;
  content: Content;
}

export interface Content {
  entryType: string;
  __typename: string;
  itemContent?: ItemContent;
  value?: string;
  cursorType?: string;
  stopOnEmptyResponse?: boolean;
}

export interface ItemContent {
  itemType: string;
  __typename: string;
  tweet_results: TweetResults;
  tweetDisplayType: string;
}

export interface TweetResults {
  result: TweetResultsResult;
}

export interface TweetResultsResult {
  __typename: string;
  rest_id: string;
  core: PurpleCore;
  unmention_data: UnmentionData;
  edit_control: EditControl;
  is_translatable: boolean;
  views: Views;
  source: string;
  quoted_status_result?: QuotedStatusResult;
  legacy: FluffyLegacy;
}

export interface PurpleCore {
  user_results: UserResults;
}

export interface UserResults {
  result: PurpleResult;
}

export interface PurpleResult {
  __typename: string;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: AffiliatesHighlightedLabel;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: string;
  legacy: PurpleLegacy;
  professional: Professional;
  tipjar_settings: UnmentionData;
  super_follow_eligible: boolean;
}

export interface AffiliatesHighlightedLabel {
  label: Label;
}

export interface Label {
  url: LabelURL;
  badge: Badge;
  description: string;
  userLabelType: string;
  userLabelDisplayType: string;
}

export interface Badge {
  url: string;
}

export interface LabelURL {
  url: string;
  urlType: string;
}

export interface PurpleLegacy {
  following: boolean;
  can_dm: boolean;
  can_media_tag: boolean;
  created_at: string;
  default_profile: boolean;
  default_profile_image: boolean;
  description: string;
  entities: PurpleEntities;
  fast_followers_count: number;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  has_custom_timelines: boolean;
  is_translator: boolean;
  listed_count: number;
  location: string;
  media_count: number;
  name: string;
  normal_followers_count: number;
  pinned_tweet_ids_str: string[];
  possibly_sensitive: boolean;
  profile_banner_url: string;
  profile_image_url_https: string;
  profile_interstitial_type: string;
  screen_name: string;
  statuses_count: number;
  translator_type: string;
  verified: boolean;
  want_retweets: boolean;
  withheld_in_countries: any[];
}

export interface PurpleEntities {
  description: Description;
}

export interface Description {
  urls: URLElement[];
}

export interface URLElement {
  display_url: DisplayURL;
  expanded_url: string;
  url: string;
  indices: number[];
}

export enum DisplayURL {
  NotthebeeCOM = 'notthebee.com',
  NotthebeeCOMArticlePelosi = 'notthebee.com/article/pelosi…',
  NotthebeeCOMTf580 = 'notthebee.com/tf580',
}

export interface Professional {
  rest_id: string;
  professional_type: string;
  category: any[];
}

export interface UnmentionData {}

export interface EditControl {
  edit_tweet_ids: string[];
  editable_until_msecs: string;
  is_edit_eligible: boolean;
  edits_remaining: string;
}

export interface FluffyLegacy {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_id_str: string;
  display_text_range: number[];
  entities: FluffyEntities;
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: string;
  quote_count: number;
  quoted_status_id_str?: string;
  quoted_status_permalink?: QuotedStatusPermalink;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  user_id_str: string;
  id_str: string;
  extended_entities?: ExtendedEntities;
  possibly_sensitive?: boolean;
  possibly_sensitive_editable?: boolean;
}

export interface FluffyEntities {
  hashtags: any[];
  symbols: any[];
  timestamps: any[];
  urls: URLElement[];
  user_mentions: any[];
  media?: Media[];
}

export interface Media {
  display_url: string;
  expanded_url: string;
  id_str: string;
  indices: number[];
  media_key: string;
  media_url_https: string;
  type: string;
  url: string;
  ext_media_availability: EXTMediaAvailability;
  features: Features;
  sizes: Sizes;
  original_info: OriginalInfo;
  allow_download_status: AllowDownloadStatus;
  media_results: MediaResults;
}

export interface AllowDownloadStatus {
  allow_download: boolean;
}

export interface EXTMediaAvailability {
  status: string;
}

export interface Features {
  large: OrigClass;
  medium: OrigClass;
  small: OrigClass;
  orig: OrigClass;
}

export interface OrigClass {
  faces: any[];
}

export interface MediaResults {
  result: MediaResultsResult;
}

export interface MediaResultsResult {
  media_key: string;
}

export interface OriginalInfo {
  height: number;
  width: number;
  focus_rects: FocusRect[];
}

export interface FocusRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Sizes {
  large: ThumbClass;
  medium: ThumbClass;
  small: ThumbClass;
  thumb: ThumbClass;
}

export interface ThumbClass {
  h: number;
  w: number;
  resize: string;
}

export interface ExtendedEntities {
  media: Media[];
}

export interface QuotedStatusPermalink {
  url: string;
  expanded: string;
  display: string;
}

export interface QuotedStatusResult {
  result: QuotedStatusResultResult;
}

export interface QuotedStatusResultResult {
  __typename: string;
  rest_id: string;
  core: FluffyCore;
  card: Card;
  unmention_data: UnmentionData;
  edit_control: EditControl;
  is_translatable: boolean;
  views: Views;
  source: string;
  legacy: StickyLegacy;
}

export interface Card {
  rest_id: string;
  legacy: CardLegacy;
}

export interface CardLegacy {
  binding_values: BindingValue[];
  card_platform: CardPlatform;
  name: string;
  url: string;
  user_refs_results: UserRe[];
}

export interface BindingValue {
  key: string;
  value: Value;
}

export interface Value {
  image_value?: ImageValue;
  type: Type;
  string_value?: string;
  scribe_key?: string;
  user_value?: UserValue;
  image_color_value?: ImageColorValue;
}

export interface ImageColorValue {
  palette: Palette[];
}

export interface Palette {
  rgb: RGB;
  percentage: number;
}

export interface RGB {
  blue: number;
  green: number;
  red: number;
}

export interface ImageValue {
  height: number;
  width: number;
  url: string;
}

export enum Type {
  Image = 'IMAGE',
  ImageColor = 'IMAGE_COLOR',
  String = 'STRING',
  User = 'USER',
}

export interface UserValue {
  id_str: string;
  path: any[];
}

export interface CardPlatform {
  platform: Platform;
}

export interface Platform {
  audience: Audience;
  device: Device;
}

export interface Audience {
  name: string;
}

export interface Device {
  name: string;
  version: string;
}

export interface UserRe {
  result: UserRefsResultResult;
}

export interface UserRefsResultResult {
  __typename: string;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: UnmentionData;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: string;
  legacy: TentacledLegacy;
  tipjar_settings: UnmentionData;
  super_follow_eligible: boolean;
}

export interface TentacledLegacy {
  can_dm: boolean;
  can_media_tag: boolean;
  created_at: string;
  default_profile: boolean;
  default_profile_image: boolean;
  description: string;
  entities: TentacledEntities;
  fast_followers_count: number;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  has_custom_timelines: boolean;
  is_translator: boolean;
  listed_count: number;
  location: string;
  media_count: number;
  name: string;
  normal_followers_count: number;
  pinned_tweet_ids_str: any[];
  possibly_sensitive: boolean;
  profile_banner_url: string;
  profile_image_url_https: string;
  profile_interstitial_type: string;
  screen_name: string;
  statuses_count: number;
  translator_type: string;
  url: string;
  verified: boolean;
  verified_type: string;
  want_retweets: boolean;
  withheld_in_countries: any[];
}

export interface TentacledEntities {
  description: Description;
  url: Description;
}

export interface FluffyCore {
  user_results: UserRe;
}

export interface StickyLegacy {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_id_str: string;
  display_text_range: number[];
  entities: FluffyEntities;
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: string;
  possibly_sensitive: boolean;
  possibly_sensitive_editable: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  user_id_str: string;
  id_str: string;
}

export interface Views {
  count: string;
  state: string;
}

export interface ResponseObjects {
  feedbackActions: any[];
  immediateReactions: any[];
}

export interface TweetItem {
  id: string;
  title: string;
  url: string;
  type: string;
  user_create_time: Date;
  node_id: string;
  node_index: string;
  parentId: string;
  user_used_time: Date;
  origin_info: string;
  author: string;
  content: string;
  status: string;
  checked?: boolean;
  isUpdate?: boolean;
}

export interface LocalTwitterAPIInfo {
  XBookmarkHeaders: XBookmarkHeaders;
}

export interface XBookmarkHeaders {
  headers: Header[];
  method: string;
  url: string;
}

export interface Header {
  name: string;
  value: string;
}
