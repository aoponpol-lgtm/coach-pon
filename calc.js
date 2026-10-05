/**
 * Coach Pon — คำนวณแผนเริ่มต้น (ใช้ทั้งหน้าเว็บและทดสอบด้วย node)
 * BMI · BMR (Mifflin-St Jeor) · TDEE · ตัวเลือกแคลอรี่ที่ปลอดภัย · สัดส่วนอาหาร · Timeline
 */
(function (root) {
  const KCAL_PER_KG = 7700;

  const LIFESTYLE = {
    sit: { label: 'นั่งทำงานเป็นส่วนใหญ่', base: 1.2 },
    light: { label: 'เดินบ้าง ยืนบ้าง', base: 1.3 },
    active: { label: 'ยืน/เดิน/ใช้แรงทั้งวัน', base: 1.4 },
  };

  const MACROS = {
    coach: { label: 'Coach Pon', th: 'ครูพลแนะนำ', byWeight: true },
    balanced: { label: 'Balanced', th: 'สมดุล', p: 30, c: 40, f: 30 },
    loss: { label: 'Weight Loss', th: 'ลดไขมัน', p: 40, c: 30, f: 30 },
    lean: { label: 'Lean Bulk', th: 'เพิ่มกล้ามแบบลีน', p: 35, c: 45, f: 20 },
    bulk: { label: 'General Bulk', th: 'เพิ่มน้ำหนัก', p: 25, c: 55, f: 20 },
  };

  function ageFrom(birth, today) {
    const b = new Date(birth + 'T00:00:00'), t = today ? new Date(today + 'T00:00:00') : new Date();
    if (isNaN(b)) return null;
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }

  function bmi(kg, cm) {
    const m = cm / 100;
    return Math.round((kg / (m * m)) * 10) / 10;
  }

  /** เกณฑ์ BMI สำหรับคนเอเชีย (WHO Asia-Pacific) */
  function bmiClass(v) {
    if (v < 18.5) return { key: 'under', th: 'น้ำหนักน้อย' };
    if (v < 23) return { key: 'normal', th: 'ปกติ' };
    if (v < 25) return { key: 'over', th: 'ท้วม' };
    if (v < 30) return { key: 'obese1', th: 'อ้วนระดับ 1' };
    return { key: 'obese2', th: 'อ้วนระดับ 2' };
  }

  function bmr(sex, kg, cm, age) {
    const base = 10 * kg + 6.25 * cm - 5 * age;
    return Math.round(sex === 'female' ? base - 161 : base + 5);
  }

  /** ตัวคูณกิจกรรม = ไลฟ์สไตล์ + นาทีออกกำลังต่อสัปดาห์ (สูงสุด 1.9) */
  function activityFactor(lifestyle, minutes, days) {
    const base = (LIFESTYLE[lifestyle] || LIFESTYLE.sit).base;
    const weekly = Math.max(0, Number(minutes) || 0) * Math.max(0, Number(days) || 0);
    const extra = weekly <= 0 ? 0 : weekly < 90 ? 0.1 : weekly < 180 ? 0.2 : weekly < 300 ? 0.3 : weekly < 450 ? 0.4 : 0.5;
    return Math.min(1.9, Math.round((base + extra) * 1000) / 1000);
  }

  function minKcal(sex, bmrVal) {
    return Math.max(bmrVal, sex === 'female' ? 1200 : 1500);
  }

  const round10 = (n) => Math.round(n / 10) * 10;

  /**
   * ตัวเลือกแคลอรี่ตามเป้าหมาย
   * คืน [{kcal, kgPerWeek, title, note, warn}] — ไม่เสนอค่าที่ต่ำกว่าเกณฑ์ปลอดภัย
   */
  function calorieOptions(p) {
    const tdee = p.tdee, floor = minKcal(p.sex, p.bmr);
    const opts = [];
    if (p.goal === 'lose') {
      if (p.bmi < 18.5) {
        opts.push({ kcal: round10(tdee), kgPerWeek: 0, title: 'รักษาน้ำหนัก', note: 'BMI ต่ำกว่าเกณฑ์ ไม่แนะนำให้ลดน้ำหนัก ควรปรึกษาครูพลก่อน', warn: true });
        return opts;
      }
      [
        [0.25, 'ค่อยเป็นค่อยไป', 'รักษากล้ามเนื้อได้ดี กินง่าย ทำต่อเนื่องได้ยาว'],
        [0.5, 'มาตรฐาน', 'เห็นผลชัดใน 4–6 สัปดาห์ ต้องกินโปรตีนให้ถึงและฝึกเวท'],
        [0.75, 'เร่งผล', 'เร็ว แต่หิวและล้าง่าย เหมาะช่วงสั้น ๆ ภายใต้การดูแลของโค้ช'],
      ].forEach((r) => {
        const kcal = round10(tdee - (r[0] * KCAL_PER_KG) / 7);
        if (kcal >= floor) opts.push({ kcal: kcal, kgPerWeek: -r[0], title: r[1], note: r[2] });
      });
      if (!opts.length) {
        opts.push({ kcal: round10(floor), kgPerWeek: -Math.round(((tdee - floor) * 7 / KCAL_PER_KG) * 100) / 100,
          title: 'ลดแบบปลอดภัย', note: 'พลังงานรายวันต่ำแล้ว ลดช้า ๆ และเพิ่มการเคลื่อนไหวจะดีกว่า', warn: true });
      }
    } else if (p.goal === 'gain') {
      [
        [0.25, 'ลีน', 'เพิ่มกล้ามโดยไขมันขึ้นน้อย เหมาะกับคนส่วนใหญ่'],
        [0.5, 'เร่งเพิ่ม', 'น้ำหนักขึ้นเร็ว เหมาะกับคนผอมมากหรือฝึกหนัก'],
      ].forEach((r) => opts.push({ kcal: round10(tdee + (r[0] * KCAL_PER_KG) / 7), kgPerWeek: r[0], title: r[1], note: r[2] }));
    } else {
      opts.push({ kcal: round10(tdee), kgPerWeek: 0, title: 'รักษาน้ำหนัก', note: 'กินเท่าที่ใช้ เน้นสร้างกล้ามและความแข็งแรง' });
      opts.push({ kcal: round10(tdee - 150), kgPerWeek: 0, title: 'กระชับ (Recomp)', note: 'ลดเล็กน้อย + ฝึกเวท ไขมันลด กล้ามคงที่หรือเพิ่ม' });
    }
    return opts;
  }

  function checkCustom(p, kcal) {
    const floor = minKcal(p.sex, p.bmr);
    if (!(kcal > 0)) return { ok: false, msg: 'กรอกตัวเลขแคลอรี่' };
    if (kcal < floor) return { ok: true, warn: true, msg: 'ต่ำกว่าระดับที่ปลอดภัย (' + floor + ' kcal) แนะนำให้ปรึกษาครูพลก่อน' };
    if (kcal > p.tdee + 1000) return { ok: true, warn: true, msg: 'สูงกว่าที่ร่างกายใช้มาก น้ำหนักอาจขึ้นเร็ว' };
    return { ok: true, msg: '' };
  }

  function macroGrams(kcal, key, kg) {
    if (!MACROS[key]) key = 'coach';
    const m = MACROS[key];
    let protein, fat, carbs;
    if (m.byWeight) {
      // ครูพลแนะนำ: โปรตีน 2 g/กก. (ไม่เกิน 40% ของพลังงาน) · ไขมัน 25% · ที่เหลือเป็นคาร์บ
      protein = Math.round(Math.min(kg * 2, (kcal * 0.4) / 4));
      fat = Math.round((kcal * 0.25) / 9);
      carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    } else {
      protein = Math.round((kcal * m.p / 100) / 4);
      carbs = Math.round((kcal * m.c / 100) / 4);
      fat = Math.round((kcal * m.f / 100) / 9);
    }
    const pct = (g, k) => Math.round((g * k * 100) / kcal);
    const out = {
      key: key, label: m.label, th: m.th, p: pct(protein, 4), c: pct(carbs, 4), f: pct(fat, 9),
      protein_g: protein, carbs_g: carbs, fat_g: fat,
      protein_per_kg: Math.round((protein / kg) * 10) / 10,
    };
    out.protein_note = out.protein_per_kg < 1.6 ? 'โปรตีนต่ำกว่าที่แนะนำ (1.6–2.2 g/กก.)'
      : out.protein_per_kg > 2.6 ? 'โปรตีนสูงเกินจำเป็น (เกิน 2.6 g/กก.)' : '';
    return out;
  }

  function defaultMacro() {
    return 'coach';
  }

  /** จำนวนสัปดาห์ถึงน้ำหนักเป้าหมาย (null = ไม่มีเป้า/ทิศทางไม่ตรง) */
  function timeline(kg, goalKg, kgPerWeek) {
    if (!goalKg || !kgPerWeek) return null;
    const diff = goalKg - kg;
    if (diff === 0 || Math.sign(diff) !== Math.sign(kgPerWeek)) return null;
    return Math.ceil(Math.abs(diff) / Math.abs(kgPerWeek));
  }

  /** คำนวณทั้งชุดจากคำตอบ */
  function profile(a, today) {
    const age = ageFrom(a.birth_date, today);
    const kg = Number(a.weight_kg), cm = Number(a.height_cm);
    const b = bmi(kg, cm), r = bmr(a.sex, kg, cm, age);
    const factor = activityFactor(a.lifestyle, a.minutes, a.days);
    return { age: age, bmi: b, bmiClass: bmiClass(b), bmr: r, factor: factor, tdee: Math.round(r * factor), sex: a.sex, goal: a.goal };
  }

  const api = {
    LIFESTYLE: LIFESTYLE, MACROS: MACROS, ageFrom: ageFrom, bmi: bmi, bmiClass: bmiClass, bmr: bmr,
    activityFactor: activityFactor, minKcal: minKcal, calorieOptions: calorieOptions, checkCustom: checkCustom,
    macroGrams: macroGrams, defaultMacro: defaultMacro, timeline: timeline, profile: profile,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CPCalc = api;
})(this);
