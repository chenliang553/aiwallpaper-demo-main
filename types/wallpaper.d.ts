export interface Wallpaper {
  id?: number; //id是数据库自增的主键，所以这里也是非必填的
  user_email: string;
  img_description?: string;
  img_size?: string;
  img_url: string;
  llm_name: string;
  llm_params?: string; // ？表示非必填。
  created_at: string;
  user_avatar?: string;
  user_nickname?: string;
}
