import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const imgUrl = '/covers/vietnam_family_temple_ngo_1783065373111.jpg';
  
  // Tìm bài viết có chứa chữ khánh thành
  const { data, error } = await supabase.from('articles').select('id, title').ilike('title', '%khánh thành%');
  
  if (error) {
    console.error('Lỗi tìm bài viết:', error);
    return;
  }
  
  for (const article of data) {
    console.log(`Đang update ảnh Nhà thờ họ (mới) cho bài: "${article.title}" (ID: ${article.id})`);
    const { error: updateError } = await supabase.from('articles').update({ cover: imgUrl }).eq('id', article.id);
    if (updateError) {
      console.error('Lỗi update:', updateError);
    }
  }
  console.log('Hoàn thành!');
}

main();
