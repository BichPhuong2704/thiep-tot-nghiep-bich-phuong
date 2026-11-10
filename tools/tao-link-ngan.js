/**
 * TẠO LINK NGẮN CHO TỪNG NGƯỜI NHẬN
 * Chạy:  node tools/tao-link-ngan.js
 *
 * - Đọc danh sách RECIPIENTS trong index.html
 * - Tạo thư mục <mã>/index.html (vd: me/index.html) chứa thẻ xem trước riêng
 *   (tiêu đề, lời mời, ảnh og/<mã>.png) để Zalo / Messenger hiện thẻ đẹp,
 *   rồi tự chuyển sang thiệp chính ../?to=<mã>
 * - Ghi tools/og-recipients.json để tools/og-maker.html vẽ ảnh xem trước
 *
 * Thêm người mới: thêm vào RECIPIENTS trong index.html → chạy lại script này
 * → mở tools/og-maker.html để vẽ ảnh → commit.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://quocbao2406.github.io/thiep-tot-nghiep-bich-phuong';
const IMG_VERSION = 1; // tăng số này khi vẽ lại ảnh để Zalo/Messenger lấy ảnh mới

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const re = /^\s*'([a-z0-9-]+)': \{ name: '([^']+)', you: '([^']+)', self: '([a-z]+)'/gm;
const people = [];
let m;
while ((m = re.exec(html))) people.push({ slug: m[1], name: m[2], you: m[3], self: m[4] });
if (!people.length) throw new Error('Không đọc được RECIPIENTS trong index.html');

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const AFTERNOON = ['em', 'di']; // gia đình (trừ Mẹ): chụp ảnh 16h–17h chiều

function texts(p) {
  const time = AFTERNOON.includes(p.self) ? 'chụp ảnh tri ân 16h–17h chiều' : 'chụp ảnh 9h–11h sáng';
  const imgTime = AFTERNOON.includes(p.self) ? 'Chụp ảnh tri ân 16:00 – 17:00 chiều' : 'Chụp ảnh 09:00 – 11:00 sáng';
  const self = { con: 'con', em: 'em', di: 'dì', chi: 'chị', ban: 'mình' }[p.self];
  const greet = p.self === 'con' ? `Gửi ${p.name} yêu của con ♡` : `Gửi ${p.name} ♡`;
  return {
    title: `Thư Mời Lễ Tốt Nghiệp – ${greet}`,
    desc: `${cap(self)} mời ${p.you} đến chung vui ngày tốt nghiệp của ${self} – Chủ Nhật 22/11/2026, ${time}. ` +
      `${cap(p.you)} chạm vào đây để mở thiệp nha ♡`,
    greet,
    imgTime
  };
}

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const ogList = [{ slug: 'chung', greet: 'Gửi bạn bè & người thân ♡', imgTime: 'Chụp ảnh 09:00 – 11:00 sáng' }];

for (const p of people) {
  const t = texts(p);
  ogList.push({ slug: p.slug, greet: t.greet, imgTime: t.imgTime });
  const target = `../?to=${p.slug}`;
  const page = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Trang này được tạo bởi tools/tao-link-ngan.js – đừng sửa tay -->
  <title>${esc(t.title)}</title>
  <meta name="description" content="${esc(t.desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE_URL}/${p.slug}/">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${esc(t.desc)}">
  <meta property="og:image" content="${BASE_URL}/og/${p.slug}.png?v=${IMG_VERSION}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(t.title)}">
  <meta name="twitter:description" content="${esc(t.desc)}">
  <meta name="twitter:image" content="${BASE_URL}/og/${p.slug}.png?v=${IMG_VERSION}">
  <meta name="theme-color" content="#003D7A">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>">
  <script>location.replace(${JSON.stringify(target)});</script>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #e8f4fd; font-family: system-ui, sans-serif; }
    a { padding: 14px 28px; border-radius: 14px; background: #003D7A; color: #fff; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <a href="${target}">Mở thiệp ♡</a>
</body>
</html>
`;
  fs.mkdirSync(path.join(ROOT, p.slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p.slug, 'index.html'), page);
}

fs.writeFileSync(path.join(__dirname, 'og-recipients.json'), JSON.stringify(ogList, null, 2));
console.log(`Đã tạo ${people.length} link ngắn:`);
for (const p of people) console.log(`  ${p.name.padEnd(22)} ${BASE_URL}/${p.slug}/`);
