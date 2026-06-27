const fetch = require('node-fetch');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = 
<div id="page-notifikasi" class="page-view hidden space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h2 class="text-xl font-bold text-slate-900">Pusat Notifikasi</h2>
        </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-4 font-medium text-xs text-slate-600">
            <div class="dummy">Old Data</div>
        </div>
    </div>
</div>
;

const dom = new JSDOM(html);
const document = dom.window.document;

async function test() {
    const data = {
        success: true,
        data: [
            {id: 1, judul: 'Test 1', pesan: 'Pesan 1', tipe: 'info', dibaca: 0},
            {id: 2, judul: 'Test 2', pesan: 'Pesan 2', tipe: 'success', dibaca: 1}
        ]
    };

    const container = document.querySelector('#page-notifikasi .lg\\:col-span-2');
    if (container) {
        container.innerHTML = '';
        if (data.data.length > 0) {
            data.data.forEach(n => {
                const iconMap = { info: 'fa-circle-exclamation text-blue-600', success: 'fa-circle-check text-emerald-600', warning: 'fa-triangle-exclamation text-amber-600', error: 'fa-circle-xmark text-red-600' };
                const borderMap = { info: 'border-blue-600', success: 'border-emerald-600', warning: 'border-amber-600', error: 'border-red-600' };
                const bgMap = { info: 'bg-blue-50', success: 'bg-emerald-50', warning: 'bg-amber-50', error: 'bg-red-50' };
                const icon = iconMap[n.tipe] || iconMap.info;
                const border = borderMap[n.tipe] || borderMap.info;
                const bg = bgMap[n.tipe] || bgMap.info;

                container.innerHTML += <div class="bg-white border-l-4 \ p-4 border border-slate-200 rounded-r-2xl shadow-3xs flex gap-3 \">
                    <div class="w-8 h-8 \ rounded-lg flex items-center justify-center text-xs shrink-0"><i class="fa-solid \"></i></div>
                    <div><h5 class="font-bold text-slate-900 text-sm">\</h5><p class="text-xs text-slate-500 mt-0.5">\</p></div>
                </div>;
            });
        }
    }
    console.log(container.innerHTML);
}
test();
