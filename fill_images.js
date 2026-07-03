import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const IMAGES = [
  '/covers/vietnam_village_gate_wide_1783064767102.jpg',
  '/covers/vietnam_communal_house_wide_1783064776329.jpg',
  '/covers/vietnam_rice_field_wide_1783064786071.jpg',
  '/covers/vietnam_ancestor_altar_wide_1783064797327.jpg',
];

async function main() {
  const { data: articles, error } = await supabase.from('articles').select('id');
  if (error) {
    console.error('Lỗi lấy bài viết:', error);
    return;
  }
  
  if (articles.length === 0) {
    console.log('Không có bài viết nào.');
    return;
  }

  let i = 0;
  for (const article of articles) {
    const imgUrl = IMAGES[i % IMAGES.length];
    console.log(`Đang thay thế ảnh 16:9 cho bài viết ID: ${article.id}`);
    const { error: updateError } = await supabase.from('articles').update({ cover: imgUrl }).eq('id', article.id);
    if (updateError) {
      console.error('Lỗi update:', updateError);
    }
    i++;
  }
  console.log('Hoàn thành! Đã thay toàn bộ ảnh thành chuẩn 16:9.');
}

main();
