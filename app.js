/* ====== UBAH BAGIAN INI ====== */
const CONFIG = {
  whatsapp: "6289630734293",             // format 62..., tanpa +
  email: "heavensquill1@gmail.com",
  mainSite: "https://situs-utamamu.com", // website baca novelmu
  /* tarif per 1.000 kata */
  rates: { Standar: 25000, Premium: 40000 },
  /* kecepatan kerja: kata per hari (untuk estimasi waktu) */
  wordsPerDay: { Standar: 5000, Premium: 3500 }
};
/* ============================= */

const LOGO = '<svg viewBox="0 0 320 320" aria-hidden="true"><path d="M160 6 314 160 160 314 6 160Z" fill="none" stroke="#5aa9e0" stroke-opacity=".35" stroke-width="2"/><path d="M160 70 250 160 160 250 70 160Z" fill="#17507a" fill-opacity=".45" stroke="#5aa9e0" stroke-width="9"/><path d="M160 110 210 160 160 210 110 160Z" fill="none" stroke="#5aa9e0" stroke-width="7"/><path d="M160 70V250M70 160H250" stroke="#5aa9e0" stroke-opacity=".35" stroke-width="2"/><circle cx="160" cy="160" r="12" fill="none" stroke="#5aa9e0" stroke-width="6"/></svg>';
const PAGES = [["index.html","Beranda"],["layanan.html","Layanan & Harga"],["contoh.html","Contoh"],["faq.html","FAQ"],["pesan.html","Pesan"]];
const here = (location.pathname.split('/').pop() || 'index.html');
const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const $ = s => document.querySelector(s);

/* header + footer dipasang dari sini, jadi menu cukup diubah di satu tempat */
document.body.insertAdjacentHTML('afterbegin',
 '<a class="skip" href="#main">Lewati ke isi</a><header><div class="wrap nav"><a class="brand" href="index.html">' + LOGO + 'Heavensquill</a>' +
 '<button class="burger" aria-expanded="false" aria-controls="menu">Menu</button><nav aria-label="Menu utama"><ul id="menu">' +
 PAGES.map(([h,t]) => '<li><a href="'+h+'"'+(h===here?' aria-current="page"':'')+(h==='pesan.html'?' class="cta"':'')+'>'+t+'</a></li>').join('') +
 '</ul></nav></div></header>');
document.body.insertAdjacentHTML('beforeend',
 '<footer><div class="wrap"><span>© '+new Date().getFullYear()+' Heavensquill</span><span><a href="'+CONFIG.mainSite+'">Baca novel di situs utama</a></span><span><a href="mailto:'+CONFIG.email+'">'+CONFIG.email+'</a></span></div></footer>' +
 '<button class="top" aria-label="Kembali ke atas">↑</button>' +
 (here==='pesan.html'?'':'<a class="wa" href="https://wa.me/'+CONFIG.whatsapp+'">Chat WhatsApp</a>'));
const main = $('main'); if (main) main.id = 'main';

const burger = $('.burger'), menu = $('#menu');
burger.onclick = () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
const toTop = $('.top');
addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 500), {passive:true});
toTop.onclick = () => scrollTo({top:0});

/* kalkulator estimasi (layanan.html) */
const calc = $('#calc');
if (calc) {
  const f = calc.elements, out = $('#calc-out');
  const run = () => {
    const w = (+f.kata.value || 0) * (f.satuan.value === 'bab' ? +f.kata_per_bab.value || 0 : 1);
    const p = f.paket.value;
    if (!w) { out.innerHTML = '<span class="hint">Isi jumlah kata atau bab untuk melihat estimasi.</span>'; return; }
    const days = Math.max(1, Math.ceil(w / CONFIG.wordsPerDay[p]));
    out.innerHTML = '<small>Estimasi ('+w.toLocaleString('id-ID')+' kata, paket '+p+')</small><b>'+rp(w/1000*CONFIG.rates[p])+'</b><small>Sekitar '+days+' hari kerja</small>';
    $('#calc-order').href = 'pesan.html?paket='+p+'&kata='+w;
  };
  calc.addEventListener('input', () => { calc.querySelector('.bab-only').hidden = f.satuan.value !== 'bab'; run(); });
  run();
}

/* formulir pesan (pesan.html) */
const form = $('#order');
if (form) {
  const KEY = 'hq-draft', note = $('#saved');
  const q = new URLSearchParams(location.search);
  try { Object.entries(JSON.parse(localStorage.getItem(KEY) || '{}')).forEach(([k,v]) => form.elements[k] && (form.elements[k].value = v)); } catch(e){}
  if (q.get('paket')) form.elements.paket.value = q.get('paket');
  if (q.get('kata')) form.elements.kata.value = q.get('kata');
  form.addEventListener('input', () => {
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(new FormData(form)))); note.textContent = 'Draf tersimpan di perangkat ini.'; } catch(e){}
  });
  const msg = () => { const d = Object.fromEntries(new FormData(form)); return [
    'Halo Heavensquill, saya ingin memesan jasa translate novel.','',
    'Nama: '+d.nama,'Judul novel: '+d.judul,'Bahasa: '+d.asal+' ke '+d.tujuan,
    'Perkiraan jumlah kata: '+(d.kata||'-'),'Paket: '+d.paket,'Tenggat: '+(d.tenggat||'-'),'Catatan: '+(d.catatan||'-')].join('\n'); };
  form.addEventListener('submit', e => { e.preventDefault(); window.open('https://wa.me/'+CONFIG.whatsapp+'?text='+encodeURIComponent(msg()), '_blank', 'noopener'); });
  $('#mailbtn').onclick = () => { if (form.reportValidity()) location.href = 'mailto:'+CONFIG.email+'?subject='+encodeURIComponent('Pesanan terjemahan: '+form.elements.judul.value)+'&body='+encodeURIComponent(msg()); };
  $('#copybtn').onclick = async () => { if (!form.reportValidity()) return; try { await navigator.clipboard.writeText(msg()); note.textContent = 'Pesan disalin.'; } catch(e){ note.textContent = 'Gagal menyalin, coba lewat WhatsApp.'; } };
  $('#clearbtn').onclick = () => { localStorage.removeItem(KEY); form.reset(); note.textContent = 'Draf dihapus.'; };
}
