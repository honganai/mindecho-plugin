import { EntityURL } from './index';

export interface TimelineUser {
  itemType: 'TimelineUser';
  __typename: 'TimelineUser';
  user_results: {
    result: User;
  };
  userDisplayType: string;
}

export interface User {
  __typename: 'User';
  id: string;
  rest_id: string;
  affiliates_highlighted_label: unknown;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: 'Square' | 'Circle';
  legacy: {
    followed_by: boolean;
    following: boolean;
    can_dm: boolean;
    can_media_tag: boolean;
    created_at: string;
    default_profile: boolean;
    default_profile_image: boolean;
    description: string;
    entities: UserEntities;
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
    profile_banner_url?: string;
    profile_image_url_https: string;
    profile_interstitial_type: string;
    screen_name: string;
    statuses_count: number;
    translator_type: string;
    url: string;
    verified: boolean;
    verified_type: string;
    want_retweets: boolean;
    withheld_in_countries: unknown[];
  };
  professional?: {
    rest_id: string;
    professional_type: string;
    category: {
      id: number;
      name: string;
      icon_name: string;
    }[];
  };
}

export interface UserEntities {
  description: {
    urls: EntityURL[];
  };
  url: {
    urls: EntityURL[];
  };
}
