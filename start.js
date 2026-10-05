/* Coach Pon — หน้าแรก / สมัครสมาชิก / เข้าสู่ระบบ (หน้าเว็บสาธารณะ ก่อนเข้าแอป) */
(function () {
  const CFG = window.CP_CONFIG;
  const C = window.CPCalc;
  const KEY = 'cp_session', DRAFT = 'cp_signup';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };

  // คำตอบที่กรอกระหว่างสมัคร (เก็บในเครื่อง กลับมาทำต่อได้)
  let D = {};
  try { D = JSON.parse(ls.get(DRAFT) || '{}'); } catch (e) { D = {}; }
  const save = () => ls.set(DRAFT, JSON.stringify(D));

  async function api(body) {
    const res = await fetch(CFG.EXEC_URL, { method: 'POST', body: JSON.stringify(body) });
    return res.json();
  }

  /* ---------- ลำดับหน้า ---------- */
  const FLOW = ['name', 'sexbirth', 'body', 'goal', 'goalweight', 'activity', 'calories', 'macro', 'summary', 'extra', 'health', 'account'];
  const PARQ = [
    'แพทย์เคยบอกว่าคุณมีโรคหัวใจ หรือความดันโลหิตสูง',
    'เคยเจ็บหน้าอกขณะพัก ทำกิจวัตร หรือออกกำลังกาย',
    'ใน 12 เดือนที่ผ่านมา เคยเวียนศีรษะจนเสียการทรงตัว หรือหมดสติ',
    'เคยได้รับการวินิจฉัยโรคเรื้อรังอื่น',
    'ตอนนี้ใช้ยาที่แพทย์สั่งเพื่อรักษาโรคเรื้อรัง',
    'ใน 12 เดือนที่ผ่านมา มีปัญหากระดูก ข้อต่อ กล้ามเนื้อ หรือเอ็น ที่อาจแย่ลงถ้าออกกำลังกาย',
    'แพทย์เคยบอกว่าควรออกกำลังกายภายใต้การดูแลทางการแพทย์เท่านั้น',
  ];
  let cur = 'welcome';
  let msg = '';
  const skip = (s) => s === 'goalweight' && D.goal === 'maintain';
  const steps = () => FLOW.filter((s) => !skip(s));

  function go(s, message) {
    cur = s;
    msg = message || '';
    render();
    window.scrollTo(0, 0);
  }
  function next() {
    const list = steps();
    const i = list.indexOf(cur);
    go(list[Math.min(i + 1, list.length - 1)]);
  }
  function back() {
    const list = steps();
    const i = list.indexOf(cur);
    if (cur === 'signin' || cur === 'reset' || i <= 0) return go('welcome');
    go(list[i - 1]);
  }

  /* ---------- คำนวณ ---------- */
  function prof() {
    return C.profile({
      sex: D.sex, birth_date: D.birth_date, height_cm: D.height_cm, weight_kg: D.weight_kg,
      lifestyle: D.lifestyle || 'sit', minutes: D.minutes, days: D.days, goal: D.goal,
    });
  }
  function pickedOption(p, opts) {
    return opts.filter((o) => o.kcal === Number(D.kcal))[0] || null;
  }

  /* ---------- หน้าต่าง ๆ ---------- */
  const V = {
    welcome() {
      return `<div class="screen">
        <h1 class="hero">Build your momentum</h1>
        <p class="center th">เริ่มต้นเป้าหมายของคุณกับครูพล</p>
        <p class="center small" style="margin:0 0 20px">วิเคราะห์ร่างกาย · แคลอรี่ที่เหมาะกับคุณ · แผนเริ่มต้นฟรี</p>
        <button class="btn" data-go="name">Sign up</button>
        <p class="foot">มีบัญชีแล้ว? <button class="link" data-go="signin">Sign In</button></p>
        <p class="center small" id="hint" style="margin-top:14px"></p>
      </div>`;
    },
    name() {
      return `<div class="screen">
        <h2>What's your name?</h2><p class="sub">ชื่อจริงและชื่อเล่น ให้ครูพลเรียกคุณได้ถูก</p>
        <input id="f1" placeholder="ชื่อจริง" autocomplete="given-name" value="${esc(D.first_name)}">
        <input id="f2" placeholder="ชื่อเล่น" autocomplete="nickname" value="${esc(D.nickname)}">
        <button class="btn" id="nx">Next</button></div>`;
    },
    sexbirth() {
      return `<div class="screen">
        <h2>Gender &amp; Birthday</h2><p class="sub">ใช้คำนวณ BMI และ BMR ให้แม่นยำ</p>
        <select id="f1"><option value="">เลือกเพศ</option>
          <option value="female" ${D.sex === 'female' ? 'selected' : ''}>หญิง</option>
          <option value="male" ${D.sex === 'male' ? 'selected' : ''}>ชาย</option></select>
        <input id="f2" type="date" value="${esc(D.birth_date)}" max="${new Date().toISOString().slice(0, 10)}">
        <button class="btn" id="nx">Next</button></div>`;
    },
    body() {
      return `<div class="screen">
        <h2>Height &amp; Weight</h2><p class="sub">ปรับได้ภายหลังเมื่อวัด InBody กับครูพล</p>
        <div class="unit"><input id="f1" type="number" inputmode="decimal" placeholder="ส่วนสูง" value="${esc(D.height_cm)}"><span>cm</span></div>
        <div class="unit"><input id="f2" type="number" inputmode="decimal" step="0.1" placeholder="น้ำหนัก" value="${esc(D.weight_kg)}"><span>kg</span></div>
        <button class="btn" id="nx">Next</button></div>`;
    },
    goal() {
      const o = (k, t, s) => `<button class="opt ${D.goal === k ? 'on' : ''}" data-goal="${k}">${t}<small>${s}</small></button>`;
      return `<div class="screen">
        <h2>What's your final goal?</h2><p class="sub">เลือกเป้าหมายหลักของคุณ</p>
        ${o('lose', 'ลดน้ำหนัก / ลดไขมัน', 'Lose weight')}
        ${o('maintain', 'รักษาน้ำหนัก / กระชับ', 'Maintain & tone')}
        ${o('gain', 'เพิ่มน้ำหนัก / กล้ามเนื้อ', 'Gain weight & muscle')}
        <button class="btn" id="nx" ${D.goal ? '' : 'disabled'}>Next</button></div>`;
    },
    goalweight() {
      const m = D.height_cm / 100;
      const lo = Math.round(18.5 * m * m), hi = Math.round(22.9 * m * m);
      return `<div class="screen">
        <h2>Target weight</h2><p class="sub">${D.goal === 'lose' ? 'อยากลดให้เหลือกี่กิโล' : 'อยากเพิ่มเป็นกี่กิโล'} (ใช้ทำ Timeline)</p>
        <div class="unit"><input id="f1" type="number" inputmode="decimal" step="0.5" placeholder="น้ำหนักเป้าหมาย" value="${esc(D.goal_weight)}"><span>kg</span></div>
        <p class="small" style="margin-top:-4px">ช่วงน้ำหนักสุขภาพดีสำหรับส่วนสูงคุณ ≈ ${lo}–${hi} กก.</p>
        <button class="btn" id="nx">Next</button></div>`;
    },
    activity() {
      const mins = [0, 20, 30, 45, 60, 75, 90, 120];
      const ls2 = Object.keys(C.LIFESTYLE).map((k) => `<button class="chip ${(D.lifestyle || 'sit') === k ? 'on' : ''}" data-life="${k}">${C.LIFESTYLE[k].label}</button>`).join('');
      return `<div class="screen">
        <h2>How much do you train each week?</h2><p class="sub">ตอนนี้ (หรือที่ตั้งใจจะทำ)</p>
        <div class="inline">ฉันออกกำลังกายครั้งละ <select id="f1">${mins.map((n) => `<option value="${n}" ${Number(D.minutes) === n ? 'selected' : ''}>${n} นาที</option>`).join('')}</select></div>
        <div class="inline">สัปดาห์ละ <select id="f2">${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${Number(D.days) === n ? 'selected' : ''}>${n} วัน</option>`).join('')}</select></div>
        <p class="th" style="margin-top:8px">ชีวิตประจำวันของคุณ</p>
        <div class="chips">${ls2}</div>
        <button class="btn" id="nx">Next</button></div>`;
    },
    calories() {
      const p = prof();
      const opts = C.calorieOptions(p);
      const pick = pickedOption(p, opts);
      const custom = D.kcal && !pick ? D.kcal : '';
      const chk = custom ? C.checkCustom(p, Number(custom)) : null;
      const pos = Math.max(0, Math.min(100, ((p.bmi - 15) / (35 - 15)) * 100));
      return `<div class="screen top">
        <h2>Your Body Profile</h2>
        <div class="glass">
          <div class="row"><span>BMI<small>ดัชนีมวลกาย · ${esc(p.bmiClass.th)}</small></span><b>${p.bmi}</b></div>
          <div class="bmibar"><i style="left:${pos}%"></i></div>
          <div class="row"><span>BMR<small>พลังงานที่ร่างกายใช้ตอนพัก</small></span><b>${p.bmr.toLocaleString()} kcal</b></div>
          <div class="row"><span>TDEE<small>พลังงานที่ใช้ทั้งวัน</small></span><b>${p.tdee.toLocaleString()} kcal</b></div>
        </div>
        <h2 style="font-size:24px">อยากกินวันละกี่แคลอรี่?</h2>
        <p class="sub">1 กก. ≈ 7,700 kcal · ไม่ต่ำกว่า ${C.minKcal(p.sex, p.bmr).toLocaleString()} kcal เพื่อความปลอดภัย</p>
        ${opts.map((o) => `<button class="kcal ${pick && pick.kcal === o.kcal ? 'on' : ''}" data-kcal="${o.kcal}">
          <b>${o.kcal.toLocaleString()} kcal/วัน</b><span class="t">${o.kgPerWeek ? (o.kgPerWeek > 0 ? '+' : '') + o.kgPerWeek + ' กก./สัปดาห์' : 'คงที่'}</span>
          <small><b style="font-size:13px">${esc(o.title)}</b> · ${esc(o.note)}</small></button>`).join('')}
        <p class="small" style="margin:6px 0">หรือกำหนดเอง</p>
        <div class="unit"><input id="f1" type="number" inputmode="numeric" placeholder="เช่น 1800" value="${esc(custom)}"><span>kcal</span></div>
        ${chk && chk.msg ? `<p class="warn">${esc(chk.msg)}</p>` : ''}
        <button class="btn" id="nx" ${D.kcal ? '' : 'disabled'}>Next</button></div>`;
    },
    macro() {
      const kg = Number(D.weight_kg), kcal = Number(D.kcal);
      const sel = D.macro || C.defaultMacro(D.goal);
      return `<div class="screen top">
        <h2>Macro Split</h2><p class="sub">สัดส่วนโปรตีน · คาร์บ · ไขมัน จาก ${kcal.toLocaleString()} kcal/วัน</p>
        ${Object.keys(C.MACROS).map((k) => {
          const g = C.macroGrams(kcal, k, kg);
          return `<button class="macro ${sel === k ? 'on' : ''}" data-macro="${k}">
            <b>${esc(g.th)}</b> <span class="small">${esc(g.label)}</span>${k === 'coach' ? '<span class="tag">แนะนำ</span>' : ''}
            <div class="g"><span>โปรตีน ${g.protein_g}g<br><small>${g.p}%</small></span><span>คาร์บ ${g.carbs_g}g<br><small>${g.c}%</small></span><span>ไขมัน ${g.fat_g}g<br><small>${g.f}%</small></span></div>
            ${g.protein_note ? `<div class="warn" style="margin:6px 0 0">${esc(g.protein_note)}</div>` : ''}</button>`;
        }).join('')}
        <button class="btn" id="nx">Next</button></div>`;
    },
    summary() {
      const p = prof();
      const opts = C.calorieOptions(p);
      const pick = pickedOption(p, opts);
      const kcal = Number(D.kcal), kg = Number(D.weight_kg);
      const kgw = pick ? pick.kgPerWeek : Math.round(((kcal - p.tdee) * 7 / 7700) * 100) / 100;
      const g = C.macroGrams(kcal, D.macro || C.defaultMacro(D.goal), kg);
      const goalKg = D.goal === 'maintain' ? null : Number(D.goal_weight) || null;
      const weeks = goalKg ? C.timeline(kg, goalKg, kgw) : null;
      return `<div class="screen">
        <div class="glass">
          <h2 style="font-size:24px">Goal Summary</h2>
          <div class="row"><span>แคลอรี่ต่อวัน</span><span class="pill">${kcal.toLocaleString()} kcal</span></div>
          <div class="row"><span>โปรตีน<small>${g.protein_g * 4} kcal · ${g.protein_per_kg} g/กก.</small></span><b>${g.protein_g} g</b></div>
          <div class="row"><span>คาร์โบไฮเดรต<small>${g.carbs_g * 4} kcal</small></span><b>${g.carbs_g} g</b></div>
          <div class="row"><span>ไขมัน<small>${g.fat_g * 9} kcal</small></span><b>${g.fat_g} g</b></div>
        </div>
        <div class="glass">
          <h2 style="font-size:22px">Timeline</h2>
          ${weeks ? `<p style="margin:0">จาก <b>${kg} กก.</b> → <b>${goalKg} กก.</b> ใน <span class="pill">~${weeks} สัปดาห์</span></p>
              <p class="small" style="margin:8px 0 0">${kgw > 0 ? '+' : ''}${kgw} กก./สัปดาห์ · ผลจริงขึ้นกับการนอน ความเครียด และความสม่ำเสมอ ครูพลช่วยปรับให้ได้</p>`
            : `<p style="margin:0">${D.goal === 'maintain' ? 'รักษาน้ำหนัก ' + kg + ' กก. และสร้างความแข็งแรง' : 'ตั้งน้ำหนักเป้าหมายเพื่อดู Timeline'}</p>`}
        </div>
        <button class="btn outline" id="shareplan" style="margin-bottom:8px">📸 แชร์แผนนี้ลง IG Story</button>
        <button class="btn" id="nx">ไปต่อ</button></div>`;
    },
    health() {
      const P = D.parq || [];
      const yes = P.filter((x) => x === 'Y').length;
      return `<div class="screen top">
        <h2>Health check</h2><p class="sub">PAR-Q+ 7 ข้อ เพื่อความปลอดภัยก่อนเริ่มฝึก (ใช้เวลา 30 วินาที)</p>
        ${PARQ.map((q, i) => `<div class="glass" style="padding:14px 16px;margin-bottom:10px">
          <div style="font-size:15px;margin-bottom:10px">${i + 1}. ${esc(q)}</div>
          <div class="chips" style="margin:0"><button class="chip ${P[i] === 'N' ? 'on' : ''}" data-pq="${i}" data-v="N">ไม่ใช่</button>
          <button class="chip ${P[i] === 'Y' ? 'on' : ''}" data-pq="${i}" data-v="Y">ใช่</button></div></div>`).join('')}
        ${yes ? `<input id="f1" placeholder="รายละเอียดสั้น ๆ เช่น โรค/ยา/ตำแหน่งที่เจ็บ" value="${esc(D.parq_detail)}">
          <p class="small" style="margin-top:-4px">ไม่เป็นไร! ครูพลจะดูข้อมูลนี้ก่อนให้คุณเริ่มโปรแกรม เพื่อให้ฝึกได้ปลอดภัย</p>` : ''}
        <button class="btn" id="nx" ${P.filter(Boolean).length === PARQ.length ? '' : 'disabled'}>Next</button></div>`;
    },
    extra() {
      const I = D.interest || [];
      const chip = (k, t) => `<button class="chip ${I.indexOf(k) >= 0 ? 'on' : ''}" data-int="${k}">${t}</button>`;
      return `<div class="screen">
        <h2>ให้ครูพลช่วยอะไรดี?</h2><p class="sub">เลือกได้หลายข้อ (ข้ามได้)</p>
        <div class="chips">${chip('personal', 'เทรนตัวต่อตัว')}${chip('online', 'โค้ชออนไลน์')}${chip('program', 'โปรแกรมทำเอง')}${chip('nutrition', 'เรื่องอาหาร')}${chip('hyrox', 'เตรียมแข่ง HYROX/วิ่ง')}</div>
        <select id="f1"><option value="">ประสบการณ์ออกกำลังกาย</option>
          ${['เพิ่งเริ่ม', 'น้อยกว่า 1 ปี', '1–3 ปี', 'มากกว่า 3 ปี'].map((t) => `<option ${D.experience === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select id="f2"><option value="">รู้จักครูพลจากไหน</option>
          ${['Instagram', 'TikTok', 'Facebook', 'เพื่อนแนะนำ', 'ยิม/สถานที่ฝึก', 'อื่น ๆ'].map((t) => `<option ${D.source === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <input id="f3" placeholder="LINE ID (ไม่บังคับ)" value="${esc(D.line_id)}">
        <input id="f4" type="tel" inputmode="tel" placeholder="เบอร์โทร (ไม่บังคับ)" value="${esc(D.phone)}">
        <button class="btn" id="nx">Next</button></div>`;
    },
    account() {
      const sent = !!D.code_sent;
      return `<div class="screen">
        <h2>Create your account</h2><p class="sub">บันทึกแผนของคุณ และเข้าแอปติดตามผล</p>
        ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
        <label class="check"><input type="checkbox" id="consent" ${D.consent ? 'checked' : ''}><span>ยินยอมให้ครูพลเก็บและใช้ข้อมูลสุขภาพนี้เพื่อวางแผนและติดตามการฝึกเท่านั้น (PDPA)</span></label>
        <label class="check"><input type="checkbox" id="mkt" ${D.marketing ? 'checked' : ''}><span>รับข่าวสาร โปรแกรมใหม่ และโปรโมชันจากครูพล (ไม่บังคับ)</span></label>
        <div id="gbtn-up"></div>
        <div class="divider">หรือใช้อีเมล</div>
        <input id="em" type="email" inputmode="email" autocomplete="email" placeholder="อีเมล" value="${esc(D.email)}">
        <button class="btn small" id="sendcode">${sent ? 'ส่งรหัสอีกครั้ง' : 'ส่งรหัสยืนยัน'}</button>
        <div ${sent ? '' : 'hidden'} id="pwbox" style="margin-top:12px">
          <input id="code" inputmode="numeric" maxlength="6" placeholder="รหัสยืนยัน 6 หลักจากอีเมล">
          <input id="pw1" type="password" autocomplete="new-password" placeholder="ตั้งรหัสผ่าน">
          <p class="small" style="margin:-6px 0 10px">อย่างน้อย 8 ตัว มีทั้งตัวอักษรและตัวเลข</p>
          <input id="pw2" type="password" autocomplete="new-password" placeholder="ยืนยันรหัสผ่าน">
          <button class="btn" id="signup">Sign Up &amp; Start</button>
        </div></div>`;
    },
    signin() {
      return `<div class="screen">
        <h2>Welcome back</h2><p class="sub">เข้าสู่ระบบเพื่อดูแผนและบันทึกผล</p>
        ${msg ? `<p class="${/สำเร็จ|ส่งแล้ว|ออกจากระบบ/.test(msg) ? 'ok' : 'err'}">${esc(msg)}</p>` : ''}
        <div id="gbtn-in"></div>
        <div class="divider">หรือใช้อีเมล</div>
        <input id="em" type="email" inputmode="email" autocomplete="email" placeholder="อีเมล" value="${esc(D.email)}">
        <input id="pw" type="password" autocomplete="current-password" placeholder="รหัสผ่าน">
        <button class="btn" id="login">Sign In</button>
        <p class="foot"><button class="link" data-go="reset">ลืมรหัสผ่าน?</button> · ยังไม่มีบัญชี? <button class="link" data-go="name">Sign up</button></p></div>`;
    },
    reset() {
      return `<div class="screen">
        <h2>Reset password</h2><p class="sub">เราจะส่งรหัสยืนยันไปที่อีเมลของคุณ</p>
        ${msg ? `<p class="${/ส่งแล้ว/.test(msg) ? 'ok' : 'err'}">${esc(msg)}</p>` : ''}
        <input id="em" type="email" inputmode="email" placeholder="อีเมล" value="${esc(D.email)}">
        <button class="btn small" id="sendreset">ส่งรหัสยืนยัน</button>
        <div style="margin-top:12px">
          <input id="code" inputmode="numeric" maxlength="6" placeholder="รหัสยืนยัน 6 หลัก">
          <input id="pw1" type="password" autocomplete="new-password" placeholder="รหัสผ่านใหม่">
          <input id="pw2" type="password" autocomplete="new-password" placeholder="ยืนยันรหัสผ่านใหม่">
          <button class="btn" id="doreset">ตั้งรหัสผ่านใหม่</button>
        </div></div>`;
    },
  };

  /* ---------- วาดหน้า + ผูกเหตุการณ์ ---------- */
  function render() {
    const list = steps();
    const idx = list.indexOf(cur);
    $('bg').className = 'bg' + (['calories', 'macro', 'summary', 'account', 'signin', 'reset'].indexOf(cur) >= 0 ? ' dim' : '');
    $('start').innerHTML = `
      <div class="topbar">
        <button class="backbtn" ${cur === 'welcome' ? 'style="visibility:hidden"' : ''} id="back" aria-label="ย้อนกลับ">‹</button>
        <div class="logo"><b>Kru</b>Pon</div><span></span>
      </div>
      ${idx >= 0 ? `<div class="progress"><i style="width:${Math.round(((idx + 1) / list.length) * 100)}%"></i></div>` : ''}
      ${V[cur]()}
      ${idx >= 0 && cur !== 'account' ? `<p class="foot">มีบัญชีแล้ว? <button class="link" data-go="signin">Sign In</button></p>` : ''}`;
    $('back').onclick = back;
    document.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go)));
    bind[cur] && bind[cur]();
    if (cur === 'account') renderGoogle('gbtn-up', 'signup_with');
    if (cur === 'signin') renderGoogle('gbtn-in', 'signin_with');
    if (cur === 'welcome') installHint();
  }

  /** ปุ่ม Next ใช้ได้เมื่อ ok() เป็นจริง และบันทึกค่าเมื่อกด */
  function nextWhen(ok, store) {
    const nx = $('nx');
    const check = () => (nx.disabled = !ok());
    document.querySelectorAll('#start input, #start select').forEach((el) => (el.oninput = el.onchange = check));
    check();
    nx.onclick = () => {
      if (!ok()) return;
      store && store();
      save();
      next();
    };
  }

  const val = (id) => ($(id) ? $(id).value.trim() : '');
  const bind = {
    name() { nextWhen(() => val('f1') && val('f2'), () => { D.first_name = val('f1'); D.nickname = val('f2'); }); },
    sexbirth() {
      nextWhen(() => {
        const a = val('f2') && C.ageFrom(val('f2'));
        return val('f1') && a >= 12 && a <= 100;
      }, () => { D.sex = val('f1'); D.birth_date = val('f2'); });
    },
    body() {
      nextWhen(() => Number(val('f1')) >= 100 && Number(val('f1')) <= 230 && Number(val('f2')) >= 25 && Number(val('f2')) <= 300,
        () => { D.height_cm = Number(val('f1')); D.weight_kg = Number(val('f2')); delete D.kcal; });
    },
    goal() {
      document.querySelectorAll('[data-goal]').forEach((b) => (b.onclick = () => { D.goal = b.dataset.goal; delete D.kcal; save(); render(); }));
      $('nx').onclick = () => D.goal && next();
    },
    goalweight() {
      nextWhen(() => {
        const g = Number(val('f1')), w = Number(D.weight_kg);
        return g >= 25 && g <= 300 && (D.goal === 'lose' ? g < w : g > w);
      }, () => (D.goal_weight = Number(val('f1'))));
    },
    activity() {
      document.querySelectorAll('[data-life]').forEach((b) => (b.onclick = () => {
        D.minutes = Number(val('f1')); D.days = Number(val('f2')); D.lifestyle = b.dataset.life; save(); render();
      }));
      nextWhen(() => true, () => { D.minutes = Number(val('f1')); D.days = Number(val('f2')); D.lifestyle = D.lifestyle || 'sit'; delete D.kcal; });
    },
    calories() {
      document.querySelectorAll('[data-kcal]').forEach((b) => (b.onclick = () => { D.kcal = Number(b.dataset.kcal); save(); render(); }));
      $('f1').onchange = () => { const n = Number(val('f1')); if (n > 0) { D.kcal = n; save(); render(); } };
      $('nx').onclick = () => D.kcal && next();
    },
    macro() {
      document.querySelectorAll('[data-macro]').forEach((b) => (b.onclick = () => { D.macro = b.dataset.macro; save(); render(); }));
      $('nx').onclick = () => { D.macro = D.macro || C.defaultMacro(D.goal); save(); next(); };
    },
    summary() {
      $('nx').onclick = next;
      $('shareplan').onclick = () => openShare(['plan', 'profile', 'sticker']);
    },
    health() {
      document.querySelectorAll('[data-pq]').forEach((b) => (b.onclick = () => {
        D.parq = (D.parq || []).slice();
        D.parq[Number(b.dataset.pq)] = b.dataset.v;
        if ($('f1')) D.parq_detail = val('f1');
        save(); render();
      }));
      $('nx').onclick = () => {
        if ($('f1')) D.parq_detail = val('f1');
        save(); next();
      };
    },
    extra() {
      document.querySelectorAll('[data-int]').forEach((b) => (b.onclick = () => {
        const I = D.interest || [];
        const k = b.dataset.int;
        D.interest = I.indexOf(k) >= 0 ? I.filter((x) => x !== k) : I.concat(k);
        keepExtra(); save(); render();
      }));
      const keepExtra = () => { D.experience = val('f1'); D.source = val('f2'); D.line_id = val('f3'); D.phone = val('f4'); };
      $('nx').onclick = () => { keepExtra(); save(); next(); };
    },
    account() {
      const keep = () => { D.consent = $('consent').checked; D.marketing = $('mkt').checked; D.email = val('em'); save(); };
      $('consent').onchange = $('mkt').onchange = keep;
      $('sendcode').onclick = async () => {
        keep();
        if (!D.consent) return go('account', 'กรุณาติ๊กยินยอมการเก็บข้อมูลก่อน');
        if (!/\S+@\S+\.\S+/.test(D.email)) return go('account', 'กรุณากรอกอีเมลให้ถูกต้อง');
        busy('sendcode', 'กำลังส่ง…');
        try {
          const r = await api({ action: 'signup_code', email: D.email });
          if (!r.ok) return go('account', r.msg || 'ส่งรหัสไม่สำเร็จ');
          D.code_sent = true; save();
          go('account', '');
          setTimeout(() => $('code') && $('code').focus(), 50);
        } catch (e) { go('account', 'เชื่อมต่อระบบไม่ได้ ลองใหม่อีกครั้ง'); }
      };
      if ($('signup')) $('signup').onclick = async () => {
        keep();
        if (!D.consent) return go('account', 'กรุณาติ๊กยินยอมการเก็บข้อมูลก่อน');
        if (val('pw1') !== val('pw2')) return go('account', 'รหัสผ่านทั้ง 2 ช่องไม่ตรงกัน');
        if (val('pw1').length < 8 || !/[a-z]/i.test(val('pw1')) || !/\d/.test(val('pw1'))) return go('account', 'รหัสผ่านต้องยาว 8 ตัวขึ้นไป มีทั้งตัวอักษรและตัวเลข');
        busy('signup', 'กำลังสร้างบัญชี…');
        finishSignup({ method: 'password', email: D.email, code: val('code'), password: val('pw1') });
      };
    },
    signin() {
      $('login').onclick = async () => {
        D.email = val('em'); save();
        busy('login', 'กำลังเข้าสู่ระบบ…');
        try {
          const r = await api({ action: 'login_password', email: val('em'), password: $('pw').value });
          if (r.ok) return enter(r.token);
          go('signin', r.msg || 'เข้าสู่ระบบไม่สำเร็จ');
        } catch (e) { go('signin', 'เชื่อมต่อระบบไม่ได้ ลองใหม่อีกครั้ง'); }
      };
    },
    reset() {
      $('sendreset').onclick = async () => {
        D.email = val('em'); save();
        busy('sendreset', 'กำลังส่ง…');
        try {
          const r = await api({ action: 'reset_code', email: D.email });
          go('reset', r.ok ? 'ส่งแล้ว ถ้าอีเมลนี้มีบัญชีแบบรหัสผ่าน จะได้รับรหัสใน 1–2 นาที' : r.msg || 'ส่งไม่สำเร็จ');
        } catch (e) { go('reset', 'เชื่อมต่อระบบไม่ได้'); }
      };
      $('doreset').onclick = async () => {
        if (val('pw1') !== val('pw2')) return go('reset', 'รหัสผ่านทั้ง 2 ช่องไม่ตรงกัน');
        busy('doreset', 'กำลังบันทึก…');
        try {
          const r = await api({ action: 'reset_password', email: val('em'), code: val('code'), password: val('pw1') });
          if (r.ok) return enter(r.token);
          go('reset', r.msg || 'ไม่สำเร็จ');
        } catch (e) { go('reset', 'เชื่อมต่อระบบไม่ได้'); }
      };
    },
  };

  function busy(id, text) {
    const b = $(id);
    if (b) { b.disabled = true; b.textContent = text; }
  }

  function answers() {
    return {
      first_name: D.first_name, nickname: D.nickname, sex: D.sex, birth_date: D.birth_date,
      height_cm: D.height_cm, weight_kg: D.weight_kg, goal: D.goal, goal_weight: D.goal === 'maintain' ? '' : D.goal_weight,
      minutes: D.minutes, days: D.days, lifestyle: D.lifestyle || 'sit', target_kcal: D.kcal, macro: D.macro || C.defaultMacro(D.goal),
      interest: D.interest || [], experience: D.experience, source: D.source, line_id: D.line_id, phone: D.phone,
      consent: !!D.consent, marketing: !!D.marketing,
      parq: D.parq || [], parq_detail: D.parq_detail || '', ref: D.ref || '',
    };
  }

  async function finishSignup(extra) {
    try {
      const r = await api(Object.assign({ action: 'signup', answers: answers() }, extra));
      if (r.ok) {
        ls.set(DRAFT, null);
        D = {};
        return enter(r.token);
      }
      if (r.error === 'exists') return go('signin', r.msg);
      go('account', r.msg || 'สมัครไม่สำเร็จ');
    } catch (e) { go('account', 'เชื่อมต่อระบบไม่ได้ ลองใหม่อีกครั้ง'); }
  }

  /* ---------- แชร์การ์ด ---------- */
  function planData() {
    const p = prof();
    const kcal = Number(D.kcal), kg = Number(D.weight_kg);
    const pick = pickedOption(p, C.calorieOptions(p));
    const kgw = pick ? pick.kgPerWeek : Math.round(((kcal - p.tdee) * 7 / 7700) * 100) / 100;
    const g = C.macroGrams(kcal, D.macro || C.defaultMacro(D.goal), kg);
    const goalKg = D.goal === 'maintain' ? null : Number(D.goal_weight) || null;
    return {
      name: D.nickname || '', goal: D.goal, kcal: kcal, protein: g.protein_g, carbs: g.carbs_g, fat: g.fat_g,
      start_weight: kg, goal_weight: goalKg, weeks: goalKg ? C.timeline(kg, goalKg, kgw) : null,
      bmi: p.bmi, bmiClass: p.bmiClass.th, bmr: p.bmr, tdee: p.tdee, shareUrl: location.origin + location.pathname,
    };
  }
  function openShare(kinds) {
    if (window.CPShare) window.CPShare.open(planData(), kinds);
  }

  /* ---------- Google ---------- */
  let gReady = false;
  window.cpInitGoogle = function () {
    google.accounts.id.initialize({ client_id: CFG.CLIENT_ID, callback: onGoogle, auto_select: false, cancel_on_tap_outside: true });
    gReady = true;
    if (cur === 'account') renderGoogle('gbtn-up', 'signup_with');
    if (cur === 'signin') renderGoogle('gbtn-in', 'signin_with');
  };
  function renderGoogle(id, text) {
    if (!gReady || !$(id)) return;
    google.accounts.id.renderButton($(id), { theme: 'filled_black', size: 'large', shape: 'pill', text: text, locale: 'th', width: 300 });
  }
  async function onGoogle(resp) {
    if (cur === 'account') {
      D.consent = $('consent').checked; D.marketing = $('mkt').checked; save();
      if (!D.consent) return go('account', 'กรุณาติ๊กยินยอมการเก็บข้อมูลก่อน แล้วกดปุ่ม Google อีกครั้ง');
      return finishSignup({ method: 'google', idToken: resp.credential });
    }
    try {
      const r = await api({ action: 'login', idToken: resp.credential });
      if (r.ok) return enter(r.token);
      if (r.error === 'not_registered') return go('name', '');
      go('signin', r.error === 'not_allowed' ? 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อครูพล' : 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง');
    } catch (e) { go('signin', 'เชื่อมต่อระบบไม่ได้'); }
  }

  /* ---------- เข้าแอป ---------- */
  function enter(token) {
    ls.set(KEY, token);
    showApp(token);
  }
  function showApp(token) {
    $('start').hidden = true;
    $('bg').hidden = true;
    const f = document.createElement('iframe');
    f.src = CFG.EXEC_URL + '?s=' + encodeURIComponent(token);
    f.title = 'Coach Pon';
    $('app').innerHTML = '';
    $('app').appendChild(f);
    $('app').hidden = false;
  }
  function showStart(screen, message) {
    $('app').hidden = true;
    $('app').innerHTML = '';
    $('start').hidden = false;
    $('bg').hidden = false;
    go(screen || 'welcome', message);
  }

  window.addEventListener('message', (ev) => {
    let host = '';
    try { host = new URL(ev.origin).hostname; } catch (e) { return; }
    if (!(host.endsWith('.googleusercontent.com') || host === 'script.google.com')) return;
    const type = ev.data && ev.data.type;
    if (type === 'cp-share' && window.CPShare && ev.data.data) {
      window.CPShare.open(ev.data.data, ev.data.kinds);
      return;
    }
    if (type === 'cp-booking' && /^https:\/\/calendar\.(app\.google|google\.com)\//.test(String(ev.data.url || ''))) {
      window.open(ev.data.url, '_blank', 'noopener');
      return;
    }
    if (type === 'cp-auth-expired') {
      ls.set(KEY, null);
      showStart('signin', 'การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    } else if (type === 'cp-logout') {
      const t = ls.get(KEY);
      ls.set(KEY, null);
      try { google.accounts.id.disableAutoSelect(); } catch (e) {}
      showStart('signin', 'ออกจากระบบแล้ว');
      if (t) api({ action: 'logout', token: t }).catch(() => {});
    }
  });

  function installHint() {
    const h = $('hint');
    if (!h || matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    h.textContent = ios ? 'เพิ่มไอคอนบนหน้าจอ: กดแชร์ (□↑) → "เพิ่มไปยังหน้าจอโฮม"' : '';
  }

  /* ---------- เริ่ม ---------- */
  (async function boot() {
    // ลิงก์ชวนเพื่อน ?ref=M001 → จำไว้ใช้ตอนสมัคร
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref && /^[CM]\d{3,}$/i.test(ref)) { D.ref = ref.toUpperCase(); save(); }
    const t = ls.get(KEY);
    if (!t) {
      // มีข้อมูลค้างจากรอบก่อน → กลับไปหน้าที่ยังไม่ครบ
      return go(location.hash === '#signin' ? 'signin' : 'welcome');
    }
    $('start').innerHTML = '<div class="screen"><p class="center small">กำลังโหลด…</p></div>';
    try {
      const r = await api({ action: 'check', token: t });
      if (r.ok) return showApp(t);
      ls.set(KEY, null);
      go('signin', 'กรุณาเข้าสู่ระบบอีกครั้ง');
    } catch (e) {
      go('welcome');
    }
  })();
})();
