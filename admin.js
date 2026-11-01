const $ = s => document.querySelector(s);
const STATUS = ['Baru','Penawaran','Menunggu DP','Dikerjakan','Revisi','Selesai','Batal'];
let token = sessionStorage.getItem('hq-token') || '', orders = [], filter = 'Semua', cur = null;
const rp = n => 'Rp ' + Math.round(+n || 0).toLocaleString('id-ID');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tgl = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}); };

async function api(body) {
  if (!CONFIG.api) throw new Error('CONFIG.api belum diisi di config.js');
  const r = await fetch(CONFIG.api, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(Object.assign({token}, body))});
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Gagal'); return j;
}
function show(on) { $('#login').hidden = on; $('#app').hidden = !on; $('#logout').hidden = !on; }
async function load() {
  try { const j = await api({action:'list'}); orders = j.orders.sort((a,b) => b.waktu.localeCompare(a.waktu)); show(true); render(); }
  catch (e) { show(false); $('#lerr').textContent = e.message; sessionStorage.removeItem('hq-token'); token = ''; }
}
$('#loginf').onsubmit = e => { e.preventDefault(); token = $('#pw').value; sessionStorage.setItem('hq-token', token); $('#lerr').textContent = 'Memeriksa…'; load(); };
$('#logout').onclick = () => { sessionStorage.removeItem('hq-token'); token = ''; orders = []; show(false); $('#lerr').textContent = ''; $('#pw').value = ''; };
$('#reload').onclick = load;
$('#q').oninput = render;

function render() {
  const q = $('#q').value.toLowerCase();
  $('#chips').innerHTML = ['Semua'].concat(STATUS).map(s => {
    const n = s === 'Semua' ? orders.length : orders.filter(o => o.status === s).length;
    return '<button class="' + (s === filter ? 'on' : '') + '" data-s="' + s + '">' + s + ' (' + n + ')</button>';
  }).join('');
  const rows = orders.filter(o => (filter === 'Semua' || o.status === filter) && [o.nama,o.judul,o.id,o.kontak].join(' ').toLowerCase().includes(q));
  const aktif = orders.filter(o => !['Selesai','Batal'].includes(o.status));
  $('#sum').textContent = aktif.length + ' pesanan aktif · nilai ' + rp(aktif.reduce((a,o) => a + (+o.harga || 0), 0));
  $('#list').innerHTML = rows.length ? rows.map(o =>
    '<button class="ord" data-id="' + esc(o.id) + '"><b>' + esc(o.judul) + '</b><span class="badge ' + esc(o.status) + '">' + esc(o.status) + '</span>' +
    '<small>' + esc(o.nama) + ' · ' + esc(o.id) + ' · ' + tgl(o.waktu) + '</small><small>' + (+o.kata ? (+o.kata).toLocaleString('id-ID') + ' kata · ' : '') + esc(o.paket) + (o.harga ? ' · ' + rp(o.harga) : '') + '</small></button>'
  ).join('') : '<p class="msg">Belum ada pesanan yang cocok.</p>';
}
$('#chips').onclick = e => { const b = e.target.closest('button'); if (b) { filter = b.dataset.s; render(); } };
$('#list').onclick = e => { const b = e.target.closest('.ord'); if (b) open(orders.find(o => o.id === b.dataset.id)); };
$('#add').onclick = () => open(null);

const F = () => $('#df').elements;
function open(o) {
  cur = o; $('#derr').textContent = '';
  $('#st').innerHTML = STATUS.map(s => '<option>' + s + '</option>').join('');
  $('#dt').textContent = o ? o.id : 'Pesanan manual';
  ['nama','kontak','judul','asal','tujuan','kata','paket','tenggat','status','harga','catatan','catatan_admin'].forEach(k => F()[k].value = o ? (o[k] || '') : (k === 'status' ? 'Baru' : ''));
  $('#del').hidden = !o; reply(); $('#dlg').showModal();
}
$('#close').onclick = () => $('#dlg').close();
$('#df').addEventListener('input', reply);

function template(d) {
  const j = '"' + d.judul + '"', t = {
    'Baru': 'Halo ' + d.nama + ', terima kasih sudah memesan terjemahan ' + j + ' di Heavensquill. Boleh kirim sampel 1-2 bab supaya kami buatkan penawaran?',
    'Penawaran': 'Halo ' + d.nama + ', penawaran untuk ' + j + ': paket ' + d.paket + (+d.kata ? ', sekitar ' + (+d.kata).toLocaleString('id-ID') + ' kata' : '') + ', total ' + rp(d.harga) + '. Jika setuju, kita lanjut ke DP.',
    'Menunggu DP': 'Halo ' + d.nama + ', untuk memulai pengerjaan ' + j + ', silakan lakukan DP sesuai kesepakatan. Kabari di sini setelah dibayar ya.',
    'Dikerjakan': 'Halo ' + d.nama + ', pengerjaan ' + j + ' sudah berjalan. Bab pertama segera kami kirim.',
    'Revisi': 'Halo ' + d.nama + ', catatan revisi untuk ' + j + ' sudah kami terima dan sedang diperbaiki.',
    'Selesai': 'Halo ' + d.nama + ', terjemahan ' + j + ' sudah selesai. Terima kasih sudah mempercayakan ke Heavensquill!',
    'Batal': 'Halo ' + d.nama + ', pesanan ' + j + ' kami tandai dibatalkan. Kabari kapan saja jika ingin melanjutkan.'
  }; return t[d.status] || '';
}
function reply() { $('#wa').href = CONFIG.discord; }
$('#cp').onclick = async () => { try { await navigator.clipboard.writeText(template(Object.fromEntries(new FormData($('#df'))))); $('#derr').textContent = ''; $('#cp').textContent = 'Tersalin'; setTimeout(() => $('#cp').textContent = 'Salin balasan', 1500); } catch (e) { $('#derr').textContent = 'Gagal menyalin'; } };

$('#df').onsubmit = async e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData($('#df'))); $('#derr').textContent = 'Menyimpan…';
  try { await api(cur ? {action:'update', id:cur.id, patch:d} : {action:'add', order:d}); $('#dlg').close(); await load(); }
  catch (er) { $('#derr').textContent = er.message; }
};
$('#del').onclick = async () => {
  if (!confirm('Hapus pesanan ' + cur.id + '? Ini tidak bisa dibatalkan.')) return;
  try { await api({action:'delete', id:cur.id}); $('#dlg').close(); await load(); } catch (er) { $('#derr').textContent = er.message; }
};
$('#csv').onclick = () => {
  const cols = ['id','waktu','nama','kontak','judul','asal','tujuan','kata','paket','tenggat','catatan','status','harga','catatan_admin'];
  const q = v => '"' + String(v || '').replace(/"/g, '""') + '"';
  const blob = new Blob(['\ufeff' + [cols.join(',')].concat(orders.map(o => cols.map(c => q(o[c])).join(','))).join('\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pesanan-heavensquill.csv'; a.click();
};
if (token) load(); else show(false);
setInterval(() => { if (token && !document.hidden && !$('#dlg').open) load(); }, 90000);
