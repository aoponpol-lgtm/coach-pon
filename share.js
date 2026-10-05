/**
 * KRUPON Share Cards — การ์ด IG Story 1080×1920 วาดด้วย canvas (ไม่ส่งข้อมูลไปไหน)
 * แบบการ์ด: plan (ภาพครูพล) · profile (กราฟิก BMI) · sticker (พื้นใส แปะบนรูปตัวเอง)
 *           kickstart (Day n/7) · complete (7/7)
 * เปิดใช้: CPShare.open(data)
 */
(function () {
  const W = 1080, H = 1920;
  const HOT = '#ff0080', GRAY = '#d9d9d9';
  const DISPLAY = '"Oswald", "Kanit", sans-serif';
  const THAI = '"Kanit", "IBM Plex Sans Thai", sans-serif';
  const GOAL_EN = { lose: 'FAT LOSS', maintain: 'MAINTAIN & TONE', gain: 'BUILD MUSCLE' };
  const GOAL_TH = { lose: 'ลดน้ำหนัก / ไขมัน', maintain: 'รักษาน้ำหนัก / กระชับ', gain: 'เพิ่มน้ำหนัก / กล้ามเนื้อ' };
  const img = {};

  function load(src) {
    if (img[src]) return img[src];
    img[src] = new Promise((res) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = src;
    });
    return img[src];
  }
  function loadScript(src) {
    return new Promise((res) => {
      if (window.qrcode) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = res;
      document.head.appendChild(s);
    });
  }
  async function fonts() {
    try {
      await Promise.all(['700 100px Oswald', '600 60px Kanit', '400 40px Kanit', '700 40px Inter'].map((f) => document.fonts.load(f)));
    } catch (e) {}
  }

  /* ---------- ตัวช่วยวาด ---------- */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function text(ctx, s, x, y, font, color, align, spacing) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spacing || 0) + 'px';
    ctx.fillText(s, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  function fit(ctx, s, maxW, size, family, weight) {
    let f = size;
    ctx.font = weight + ' ' + f + 'px ' + family;
    while (ctx.measureText(s).width > maxW && f > 20) { f -= 4; ctx.font = weight + ' ' + f + 'px ' + family; }
    return weight + ' ' + f + 'px ' + family;
  }
  function cover(ctx, im, dim) {
    if (!im) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
    const s = Math.max(W / im.width, H / im.height);
    const w = im.width * s, h = im.height * s;
    ctx.drawImage(im, (W - w) / 2, (H - h) * 0.15, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,' + (0.45 + dim) + ')');
    g.addColorStop(0.3, 'rgba(0,0,0,' + (0.25 + dim) + ')');
    g.addColorStop(0.55, 'rgba(0,0,0,' + (0.6 + dim) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0.96)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function glow(ctx, x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,0,128,' + a + ')'); g.addColorStop(1, 'rgba(255,0,128,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  async function brand(ctx, y, center) {
    const logo = await load('img/logo-pink.png');
    const lw = 120, lh = logo ? (logo.height / logo.width) * lw : 0;
    ctx.font = '700 66px ' + DISPLAY;
    const kru = ctx.measureText('KRU').width, pon = ctx.measureText('PON').width;
    const total = lw + 22 + kru + pon;
    const x0 = center ? (W - total) / 2 : 90;
    if (logo) ctx.drawImage(logo, x0, y - lh / 2 - 20, lw, lh);
    text(ctx, 'KRU', x0 + lw + 22, y, '700 66px ' + DISPLAY, HOT, 'left', 2);
    text(ctx, 'PON', x0 + lw + 22 + kru + 2, y, '700 66px ' + DISPLAY, '#fff', 'left', 2);
  }
  async function qr(ctx, url, x, y, size, withLabel) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js');
    if (!window.qrcode || !url) return;
    const q = window.qrcode(0, 'M');
    q.addData(url); q.make();
    const n = q.getModuleCount(), pad = 16, cell = (size - pad * 2) / n;
    rr(ctx, x, y, size, size, 24); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (q.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell + 0.5, cell + 0.5);
    }
    if (withLabel) text(ctx, withLabel, x + size / 2, y + size + 44, '500 30px ' + THAI, GRAY, 'center');
  }
  function footer(ctx, d, line) {
    text(ctx, 'BUILD YOUR MOMENTUM', 90, 1640, '700 58px ' + DISPLAY, '#fff', 'left', 3);
    text(ctx, line || 'สแกนเพื่อสร้างแผนของคุณฟรี กับครูพล', 90, 1700, '400 34px ' + THAI, GRAY, 'left');
  }

  /* ---------- การ์ดแต่ละแบบ ---------- */
  const CARDS = {
    async plan(ctx, d) {
      cover(ctx, await load('img/bg.jpg'), 0.05);
      glow(ctx, 960, 260, 520, 0.35);
      await brand(ctx, 220, false);
      text(ctx, 'MY DAILY TARGET · ' + (GOAL_EN[d.goal] || ''), 90, 760, '600 34px ' + DISPLAY, GRAY, 'left', 6);
      text(ctx, Number(d.kcal).toLocaleString('en-US'), 70, 1010, fit(ctx, Number(d.kcal).toLocaleString('en-US'), 900, 300, DISPLAY, 700), '#fff', 'left', -2);
      text(ctx, 'KCAL / DAY', 90, 1085, '700 70px ' + DISPLAY, HOT, 'left', 6);
      // macro bars
      const m = [['PROTEIN', d.protein, '#fff'], ['CARBS', d.carbs, HOT], ['FAT', d.fat, GRAY]];
      const tot = m.reduce((a, x) => a + (Number(x[1]) || 0) * (x[0] === 'FAT' ? 9 : 4), 0) || 1;
      let bx = 90;
      m.forEach((x) => {
        const w = Math.max(60, (900 * (Number(x[1]) || 0) * (x[0] === 'FAT' ? 9 : 4)) / tot);
        rr(ctx, bx, 1150, w - 10, 22, 11); ctx.fillStyle = x[2]; ctx.fill();
        bx += w;
      });
      m.forEach((x, i) => {
        const cx = 90 + i * 310;
        text(ctx, x[1] + 'g', cx, 1260, '700 76px ' + DISPLAY, '#fff', 'left');
        text(ctx, x[0], cx, 1305, '600 30px ' + DISPLAY, x[2] === GRAY ? GRAY : x[2], 'left', 5);
      });
      if (d.weeks && d.goal_weight) {
        rr(ctx, 90, 1370, 900, 150, 34); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        text(ctx, d.start_weight + ' → ' + d.goal_weight + ' KG', 130, 1468, '700 70px ' + DISPLAY, '#fff', 'left', 1);
        rr(ctx, 700, 1405, 260, 82, 41); ctx.fillStyle = HOT; ctx.fill();
        text(ctx, '~' + d.weeks + ' WEEKS', 830, 1462, '700 44px ' + DISPLAY, '#fff', 'center', 1);
      } else {
        text(ctx, GOAL_TH[d.goal] || '', 90, 1450, '600 50px ' + THAI, '#fff', 'left');
      }
      footer(ctx, d);
      await qr(ctx, d.shareUrl, 800, 1560, 190);
    },

    async profile(ctx, d) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      glow(ctx, 540, 900, 760, 0.28);
      const logo = await load('img/logo-pink.png');
      if (logo) { ctx.globalAlpha = 0.14; ctx.drawImage(logo, -260, 330, 1500, (logo.height / logo.width) * 1500); ctx.globalAlpha = 1; }
      await brand(ctx, 230, true);
      text(ctx, 'BODY PROFILE', 540, 470, '700 92px ' + DISPLAY, '#fff', 'center', 6);
      text(ctx, d.name ? 'ของ ' + d.name : '', 540, 540, '500 40px ' + THAI, GRAY, 'center');
      // เกจ BMI ครึ่งวงกลม
      const cx = 540, cy = 1000, r = 330;
      const seg = [[15, 18.5, GRAY], [18.5, 23, HOT], [23, 25, '#ff8fc4'], [25, 35, '#fff']];
      const ang = (v) => Math.PI + ((Math.min(35, Math.max(15, v)) - 15) / 20) * Math.PI;
      seg.forEach((s) => {
        ctx.beginPath(); ctx.arc(cx, cy, r, ang(s[0]) + 0.012, ang(s[1]) - 0.012);
        ctx.lineWidth = 46; ctx.strokeStyle = s[2]; ctx.lineCap = 'butt'; ctx.stroke();
      });
      const a = ang(Number(d.bmi));
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 70), cy + Math.sin(a) * (r - 70));
      ctx.lineWidth = 14; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fillStyle = HOT; ctx.fill();
      text(ctx, String(d.bmi), cx, cy + 150, '700 150px ' + DISPLAY, '#fff', 'center');
      text(ctx, 'BMI · ' + (d.bmiClass || ''), cx, cy + 215, '600 44px ' + THAI, HOT, 'center');
      // BMR / TDEE
      [['BMR', d.bmr], ['TDEE', d.tdee]].forEach((x, i) => {
        const bx = 120 + i * 440;
        rr(ctx, bx, 1300, 400, 200, 36); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
        text(ctx, x[0], bx + 40, 1365, '600 36px ' + DISPLAY, GRAY, 'left', 5);
        text(ctx, Number(x[1]).toLocaleString('en-US'), bx + 40, 1455, '700 80px ' + DISPLAY, '#fff', 'left');
        text(ctx, 'kcal', bx + 360, 1455, '500 32px ' + THAI, GRAY, 'right');
      });
      footer(ctx, d, 'รู้จักร่างกายตัวเองก่อนเริ่ม · สแกนเพื่อเช็กของคุณ');
      await qr(ctx, d.shareUrl, 800, 1560, 190);
    },

    async sticker(ctx, d) {
      // พื้นใส: บันทึกแล้วแปะเป็นสติกเกอร์บนรูปตัวเองใน IG Story
      ctx.clearRect(0, 0, W, H);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 24;
      await brand(ctx, 700, true);
      text(ctx, Number(d.kcal).toLocaleString('en-US'), 540, 980, '700 260px ' + DISPLAY, '#fff', 'center', -2);
      text(ctx, 'KCAL / DAY', 540, 1060, '700 64px ' + DISPLAY, HOT, 'center', 8);
      text(ctx, 'P ' + d.protein + 'g   ·   C ' + d.carbs + 'g   ·   F ' + d.fat + 'g', 540, 1160, '600 54px ' + DISPLAY, '#fff', 'center', 2);
      if (d.weeks && d.goal_weight) text(ctx, d.start_weight + ' → ' + d.goal_weight + ' KG  ·  ' + d.weeks + ' WEEKS', 540, 1245, '600 48px ' + DISPLAY, GRAY, 'center', 2);
      ctx.shadowBlur = 0;
    },

    async kickstart(ctx, d) {
      const k = d.kickstart || {};
      cover(ctx, await load('img/bg.jpg'), 0.15);
      glow(ctx, 540, 1000, 700, 0.3);
      await brand(ctx, 220, true);
      text(ctx, '7-DAY KICKSTART', 540, 520, '700 84px ' + DISPLAY, '#fff', 'center', 8);
      text(ctx, 'DAY', 540, 680, '700 90px ' + DISPLAY, HOT, 'center', 12);
      text(ctx, String(k.done || 0), 470, 1010, '700 380px ' + DISPLAY, '#fff', 'center');
      text(ctx, '/7', 690, 1010, '700 160px ' + DISPLAY, GRAY, 'center');
      // จุด 7 วัน
      const days = k.days || [];
      for (let i = 0; i < 7; i++) {
        const x = 150 + i * 130, y = 1170, done = days[i] && days[i].status === 'done';
        ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2);
        if (done) { ctx.fillStyle = HOT; ctx.fill(); text(ctx, '✓', x, y + 18, '700 52px Inter, sans-serif', '#fff', 'center'); }
        else { ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke(); text(ctx, String(i + 1), x, y + 16, '700 44px ' + DISPLAY, 'rgba(255,255,255,0.7)', 'center'); }
      }
      if (k.lastLabel) text(ctx, k.lastLabel, 540, 1330, fit(ctx, k.lastLabel, 900, 56, THAI, 600), '#fff', 'center');
      text(ctx, d.name ? d.name + ' ฝึกจริง ทำจริง 💪' : 'ฝึกจริง ทำจริง 💪', 540, 1400, '500 42px ' + THAI, GRAY, 'center');
      footer(ctx, d, 'มาเริ่ม 7 วันด้วยกันฟรี · สแกนเลย');
      await qr(ctx, d.shareUrl, 800, 1560, 190);
    },

    async complete(ctx, d) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      glow(ctx, 540, 860, 900, 0.5);
      // รัศมีดาว
      ctx.save(); ctx.translate(540, 860);
      for (let i = 0; i < 28; i++) {
        ctx.rotate((Math.PI * 2) / 28);
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(255,0,128,0.1)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -1100); ctx.lineTo(40, -1100); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      const logo = await load('img/logo-white.png');
      if (logo) ctx.drawImage(logo, 240, 380, 600, (logo.height / logo.width) * 600);
      await brand(ctx, 220, true);
      text(ctx, '7/7', 540, 1110, '700 330px ' + DISPLAY, '#fff', 'center', 4);
      text(ctx, 'KICKSTART COMPLETE', 540, 1210, '700 86px ' + DISPLAY, HOT, 'center', 6);
      text(ctx, (d.name ? d.name + ' ' : '') + 'ทำครบ 7 วันแล้ว! 🎉', 540, 1310, '600 52px ' + THAI, '#fff', 'center');
      footer(ctx, d, 'ถึงตาคุณแล้ว · เริ่ม 7 วันฟรีกับครูพล');
      await qr(ctx, d.shareUrl, 800, 1560, 190);
    },
  };

  const LABEL = { plan: 'My Plan', profile: 'Body Profile', sticker: 'สติกเกอร์ (พื้นใส)', kickstart: 'Kickstart', complete: '7/7 Complete' };

  async function render(kind, d) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    await CARDS[kind](ctx, d);
    return c;
  }

  /* ---------- หน้าต่างแชร์ ---------- */
  function css() {
    if (document.getElementById('cp-share-css')) return;
    const s = document.createElement('style');
    s.id = 'cp-share-css';
    s.textContent = `
      .shr { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.94); display: flex; flex-direction: column; color: #fff;
        padding: calc(12px + env(safe-area-inset-top)) 0 calc(16px + env(safe-area-inset-bottom)); font-family: Inter, "IBM Plex Sans Thai", Kanit, sans-serif; }
      .shr-top { display: flex; justify-content: space-between; align-items: center; padding: 0 18px 10px; }
      .shr-top b { font: 700 22px Oswald, Kanit, sans-serif; letter-spacing: 1px; }
      .shr-x { background: rgba(255,255,255,.12); color: #fff; border: 0; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; cursor: pointer; }
      .shr-row { flex: 1; min-height: 0; display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 0 12vw; align-items: center; }
      .shr-row::-webkit-scrollbar { display: none; }
      .shr-card { flex: none; height: 100%; max-height: 68vh; aspect-ratio: 9 / 16; scroll-snap-align: center; border-radius: 18px; overflow: hidden;
        background: repeating-conic-gradient(#222 0 25%, #333 0 50%) 0 0 / 24px 24px; box-shadow: 0 10px 40px rgba(0,0,0,.6); position: relative; }
      .shr-card img { width: 100%; height: 100%; display: block; }
      .shr-card span { position: absolute; left: 10px; top: 10px; background: rgba(0,0,0,.6); border-radius: 999px; padding: 4px 10px; font-size: 12px; }
      .shr-dots { display: flex; justify-content: center; gap: 6px; margin: 12px 0; }
      .shr-dots i { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.3); }
      .shr-dots i.on { background: #ff0080; width: 20px; border-radius: 4px; }
      .shr-act { display: grid; gap: 10px; padding: 0 20px; max-width: 480px; width: 100%; margin: 0 auto; }
      .shr-act button { border: 0; border-radius: 999px; padding: 15px; font: 700 17px Inter, Kanit, sans-serif; cursor: pointer; }
      .shr-go { background: #ff0080; color: #fff; }
      .shr-save { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }
      .shr-tip { text-align: center; color: #bbb; font-size: 13px; padding: 0 22px; margin: 4px 0 0; }
      .shr-link { background: none !important; color: #fff; text-decoration: underline; padding: 4px !important; font-size: 14px !important; }
      .shr-wait { color: #bbb; margin: auto; }`;
    document.head.appendChild(s);
  }

  async function open(d, kinds) {
    css();
    await fonts();
    const k = d.kickstart || {};
    kinds = kinds || ['plan', 'profile', 'sticker'].concat(k.started ? ['kickstart'] : []).concat(k.complete ? ['complete'] : []);
    if (d.focus && kinds.indexOf(d.focus) > 0) kinds = [d.focus].concat(kinds.filter((x) => x !== d.focus));
    const box = document.createElement('div');
    box.className = 'shr';
    box.innerHTML = `<div class="shr-top"><b>แชร์ลง IG Story</b><button class="shr-x" aria-label="ปิด">×</button></div>
      <div class="shr-row"><p class="shr-wait">กำลังสร้างการ์ด…</p></div><div class="shr-dots"></div>
      <div class="shr-act"><button class="shr-go">แชร์ / ส่งไป Instagram</button><button class="shr-save">บันทึกรูป</button>
        <button class="shr-link">คัดลอกลิงก์ชวนเพื่อน</button></div>
      <p class="shr-tip">IG Story: เลือกรูป → แตะสติกเกอร์ "ลิงก์" แล้ววางลิงก์ที่คัดลอกไว้ ให้เพื่อนกดสมัครได้</p>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    box.querySelector('.shr-x').onclick = close;
    const row = box.querySelector('.shr-row'), dots = box.querySelector('.shr-dots');
    const canvases = [];
    for (const kind of kinds) canvases.push(await render(kind, d));
    row.innerHTML = canvases.map((c, i) => `<div class="shr-card" data-i="${i}"><img alt="" src="${c.toDataURL('image/png')}"><span>${LABEL[kinds[i]]}</span></div>`).join('');
    dots.innerHTML = kinds.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('');
    let cur = 0;
    row.onscroll = () => {
      const w = row.querySelector('.shr-card').offsetWidth + 14;
      cur = Math.max(0, Math.min(kinds.length - 1, Math.round(row.scrollLeft / w)));
      dots.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === cur));
    };
    const blob = () => new Promise((res) => canvases[cur].toBlob(res, 'image/png'));
    const fname = () => 'krupon-' + kinds[cur] + '.png';
    box.querySelector('.shr-go').onclick = async () => {
      const b = await blob();
      const file = new File([b], fname(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: 'สร้างแผนของคุณฟรีกับครูพล ' + (d.shareUrl || '') }); } catch (e) {}
      } else {
        save(b);
      }
    };
    box.querySelector('.shr-save').onclick = async () => save(await blob());
    box.querySelector('.shr-link').onclick = async (e) => {
      try { await navigator.clipboard.writeText(d.shareUrl || location.href); e.target.textContent = 'คัดลอกแล้ว ✓'; }
      catch (err) { prompt('คัดลอกลิงก์นี้', d.shareUrl || location.href); }
    };
    function save(b) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = fname();
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  }

  window.CPShare = { open: open, render: render };
})();
