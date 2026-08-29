export type Lang = "en" | "id";

export type FaqDict = {
  eyebrow: string;
  h1: string;
  lede: string;
  thesis: string;
  sectionHowTo: string;
  howtoLede: string;
  howto1Title: string;
  howto1Text: string;
  howto2Title: string;
  howto2Text: string;
  howto3Title: string;
  howto3Text: string;
  sectionWhat: string;
  q1: string;
  a1: string;
  q2: string;
  a2: string;
  q3: string;
  a3: string;
  q4: string;
  a4: string;
  q5: string;
  a5: string;
  sectionLimits: string;
  limitsLabel: string;
  limit1: string;
  limit2: string;
  limit3: string;
  limit4: string;
  footer: string;
  closingSign: string;
  closingName: string;
  closingDate: string;
};

export const STORAGE_KEY = "zerozephyr_lang";
export const DEFAULT_LANG: Lang = "en";

export const i18n: Record<Lang, FaqDict> = {
  en: {
    eyebrow: "Zero Zephyr <span>Security FAQ</span>",
    h1: "Is my message actually safe?",
    lede: "Here's a plain look at what Zero Zephyr protects, how it does that, and what it honestly can't.",
    thesis:
      "<strong>Short answer:</strong> we can't read your message even if we wanted to. Everything gets encrypted right inside your browser before it ever leaves your device. That's something we can promise because of how the system is built, not because we're asking you to trust us.",

    sectionHowTo: "How to use it well",
    howtoLede:
      "Encryption handles the hard part, but a few small choices on your end change how exposed a link is while it sits there waiting to be opened.",

    howto1Title: "Use the built-in password generator",
    howto1Text:
      "A password you type yourself usually feels random but rarely is. A generated one actually is, which is what security people call entropy. High entropy is the real wall between an attacker and your message. Even if someone somehow got the encrypted file itself, a strong generated password makes guessing it a waste of their time.",

    howto2Title: "Set max views based on who's really getting this",
    howto2Text:
      "Sending something to one specific person? Set max views to 1. As soon as they open it, the link is gone for good, so there's nothing left to grab even if someone else stumbles onto it. Save the higher view counts for when you're actually sharing one link with a few people.",

    howto3Title: "Keep the expiry as short as you can",
    howto3Text:
      "A short expiry shrinks the window for anything to go sideways before the link disappears on its own. Combine that with a generated password and you've got two things working together: a closing clock and a password nobody's going to guess in time.",

    sectionWhat: "What's protected",

    q1: "Is my message actually safe?",
    a1: `
      <p><strong>As far as the content goes, yes, and we mean that with real confidence.</strong></p>
      <p>Zero Zephyr runs on zero-knowledge, end-to-end encryption. In practice that means:</p>
      <ul>
        <li>Encryption and decryption both happen in <strong>your browser</strong>. Our server is never involved in that part.</li>
        <li>We never see your message, your file name, or your password in their original form. All that ever reaches us is encrypted output, which just looks like noise to anyone who opens it.</li>
        <li>Your password is <strong>never transmitted</strong> anywhere, not even to us.</li>
        <li>Without the right password, that encrypted data stays unreadable to absolutely everyone, us included.</li>
      </ul>
      <p>So even if our server got broken into tomorrow, all an attacker would walk away with is a pile of scrambled data. Not your message.</p>
    `,

    q2: 'Does "safe" mean nothing can ever go wrong?',
    a2: `
      <p><strong>No honest system gets to claim that, and we won't pretend otherwise.</strong></p>
      <p>Here's what we can stand behind: breaking into our server directly gets an attacker nowhere near your message, because we never hold the key that opens it. That's not a sales pitch, it's just how the architecture works.</p>
      <p>What's outside our control is a different list, and it's worth reading. You'll find it further down this page.</p>
    `,

    q3: 'If I pick "Burn after read," does it really vanish after one view?',
    a3: `<p>Yes. The instant it's opened, the server wipes the encrypted data for good. It doesn't just get flagged as read, it's actually removed from storage. Nobody can open that link a second time, including us.</p>`,

    q4: "What happens when a link expires before anyone opens it?",
    a4: `<p>Same outcome as burn after read. Once the clock runs out, the encrypted data is permanently deleted and there's no getting it back after that.</p>`,

    q5: "Does Zero Zephyr know who I am?",
    a5: `<p>There's no account, no login, nothing tying a message to your identity. We don't keep a record of who sent or opened anything.</p>`,

    sectionLimits: "What's still on you",
    limitsLabel: "Things encryption alone can't cover",

    limit1:
      '<strong>How strong your password is.</strong> Encryption can be flawless and a weak password will still undo it. Something like a birthday or "123456" is the first thing anyone tries. Use a long, random one, or just hit Generate and let it handle that for you.',
    limit2:
      "<strong>How you hand off the password.</strong> Zero Zephyr never puts the password inside the link itself, on purpose. If you text someone both the link and the password in the same message, anyone reading over their shoulder gets both at once. Send them through two different channels.",
    limit3:
      "<strong>Whether your device is clean.</strong> If your phone or computer already has malware or a keylogger on it, encryption downstream won't help. Whatever you type can get caught before it ever gets encrypted.",
    limit4:
      "<strong>Who actually opens it, and what they do next.</strong> Once a message is decrypted and read, it's out of our hands and into theirs. We can't stop someone from taking a screenshot or copying it somewhere else.",

    footer:
      'We lock down what we control: the server, the network, the storage. The rest comes down to people: the password you pick, how you share it, the device you trust it on. No encrypted system reaches that far, no matter how good it is. <br>Got a question we haven\'t covered? Write to <a href="mailto:dev@achanam.com">dev@achanam.com</a>.',

    closingSign: "Sincerely,",
    closingName: "Ach Anam",
    closingDate: "June 21, 2026",
  },

  id: {
    eyebrow: "Zero Zephyr <span>FAQ Keamanan</span>",
    h1: "Apakah pesan saya benar-benar aman?",
    lede: "Ini penjelasan apa adanya soal apa yang dilindungi Zero Zephyr, bagaimana caranya, dan apa yang memang tidak bisa dijamin.",
    thesis:
      "<strong>Jawaban singkatnya:</strong> kami tidak bisa membaca pesan kamu, sekalipun mau. Semuanya dienkripsi langsung di browser kamu sebelum meninggalkan perangkat. Ini bukan soal percaya sama kami, tapi memang begitu cara sistemnya dibangun.",

    sectionHowTo: "Cara memakai Zero Zephyr dengan baik",
    howtoLede:
      "Enkripsi sudah mengurus bagian yang berat, tapi beberapa pilihan kecil di tangan kamu ikut menentukan seberapa rentan sebuah link selagi masih menunggu dibuka.",

    howto1Title: "Pakai password generator yang sudah ada",
    howto1Text:
      "Password yang kamu ketik sendiri biasanya terasa acak, padahal jarang benar-benar acak. Password hasil generate itu beneran acak, dan tingkat keacakan itulah yang disebut entropy. Entropy tinggi adalah tembok sesungguhnya antara penyerang dan pesan kamu. Sekalipun seseorang berhasil mendapat file terenkripsinya, password kuat hasil generate bikin usaha menebaknya jadi buang-buang waktu.",

    howto2Title: "Atur max views sesuai siapa yang benar-benar menerima",
    howto2Text:
      "Kalau pesannya memang ditujukan untuk satu orang, set max views ke 1 saja. Begitu dibuka, link itu langsung hilang untuk selamanya, jadi tidak ada apa-apa lagi yang bisa diambil walau ada yang kebetulan menemukannya. Simpan angka view yang lebih besar untuk saat kamu memang berbagi satu link ke beberapa orang.",

    howto3Title: "Buat masa berlakunya sesingkat mungkin",
    howto3Text:
      "Masa berlaku yang singkat mempersempit waktu bagi hal-hal yang bisa salah sebelum link itu hilang dengan sendirinya. Gabungkan dengan password hasil generate, dan kamu punya dua hal yang bekerja bersamaan: waktu yang terus berkurang, dan password yang nyaris mustahil ditebak tepat waktu.",

    sectionWhat: "Apa yang dilindungi",

    q1: "Apakah pesan saya benar-benar aman?",
    a1: `
      <p><strong>Untuk isi pesannya, ya, dan kami cukup yakin soal ini.</strong></p>
      <p>Zero Zephyr memakai enkripsi end-to-end dengan prinsip zero-knowledge. Singkatnya begini:</p>
      <ul>
        <li>Enkripsi dan dekripsi sama-sama terjadi di <strong>browser kamu</strong>. Server kami sama sekali tidak ikut campur di bagian itu.</li>
        <li>Kami tidak pernah melihat pesan, nama file, atau password kamu dalam bentuk aslinya. Yang sampai ke kami cuma hasil enkripsi, dan itu cuma kelihatan seperti data acak buat siapapun yang membukanya.</li>
        <li>Password kamu <strong>tidak pernah dikirim</strong> ke mana pun, termasuk ke kami.</li>
        <li>Tanpa password yang tepat, data terenkripsi itu tetap tidak terbaca buat siapapun, termasuk kami sendiri.</li>
      </ul>
      <p>Jadi sekalipun server kami diretas besok pagi, yang didapat penyerang cuma tumpukan data yang berantakan. Bukan pesan kamu.</p>
    `,

    q2: 'Apakah "aman" berarti tidak akan pernah ada yang salah?',
    a2: `
      <p><strong>Tidak ada sistem yang jujur bisa mengklaim itu, dan kami juga tidak akan berpura-pura begitu.</strong></p>
      <p>Yang bisa kami pertanggungjawabkan adalah ini: meretas server kami langsung pun tidak akan mendekatkan siapapun ke isi pesan kamu, karena kami memang tidak pernah memegang kuncinya. Ini bukan kalimat promosi, memang begitu cara arsitekturnya bekerja.</p>
      <p>Yang ada di luar kendali kami itu daftar yang berbeda, dan layak kamu baca. Ada di bagian bawah halaman ini.</p>
    `,

    q3: 'Kalau saya pilih "Burn after read," benar-benar langsung hilang setelah sekali dibuka?',
    a3: `<p>Betul. Begitu dibuka, server langsung menghapus data terenkripsinya untuk selamanya. Bukan cuma ditandai sudah dibaca, tapi memang dihapus dari penyimpanan. Tidak ada yang bisa membuka link itu untuk kedua kalinya, termasuk kami.</p>`,

    q4: "Bagaimana kalau link kedaluwarsa sebelum sempat dibuka?",
    a4: `<p>Hasilnya sama seperti burn after read. Begitu waktunya habis, data terenkripsi langsung dihapus permanen dan tidak ada cara mengambilnya kembali.</p>`,

    q5: "Apakah Zero Zephyr tahu siapa saya?",
    a5: `<p>Tidak ada akun, tidak ada login, tidak ada apapun yang menghubungkan sebuah pesan dengan identitas kamu. Kami tidak menyimpan catatan siapa yang mengirim atau membuka apa.</p>`,

    sectionLimits: "Apa yang tetap jadi tanggung jawab kamu",
    limitsLabel: "Hal yang tidak bisa diselesaikan enkripsi sendirian",

    limit1:
      '<strong>Seberapa kuat password kamu.</strong> Enkripsi bisa sempurna, tapi password yang lemah tetap bisa menggagalkan semuanya. Hal seperti tanggal lahir atau "123456" adalah yang pertama dicoba siapapun. Pakai password yang panjang dan acak, atau tinggal klik Generate dan biarkan itu yang mengurusnya.',
    limit2:
      "<strong>Cara kamu membagikan password.</strong> Zero Zephyr sengaja tidak pernah menaruh password di dalam link itu sendiri. Kalau kamu kirim link dan password dalam satu pesan yang sama, siapapun yang ikut membaca pesan itu langsung dapat keduanya. Kirim lewat dua jalur yang berbeda.",
    limit3:
      "<strong>Apakah perangkat kamu bersih.</strong> Kalau HP atau komputer kamu sudah kemasukan malware atau keylogger, enkripsi di tahap berikutnya tidak akan menolong. Apa yang kamu ketik bisa saja sudah tertangkap sebelum sempat dienkripsi.",
    limit4:
      "<strong>Siapa yang sebenarnya membuka pesan, dan apa yang mereka lakukan setelahnya.</strong> Setelah pesan didekripsi dan dibaca, kendalinya sudah berpindah sepenuhnya ke tangan mereka. Kami tidak bisa mencegah seseorang screenshot atau menyalinnya ke tempat lain.",

    footer:
      'Kami menutup celah yang memang bisa kami kendalikan, yaitu server, jaringan, dan penyimpanan. Sisanya bergantung pada manusia: password yang kamu pilih, cara kamu membagikannya, perangkat yang kamu percayakan. Sistem terenkripsi manapun tidak bisa menjangkau sejauh itu, sebaik apapun sistemnya. <br>Ada pertanyaan yang belum terjawab di sini? Kirim ke <a href="mailto:dev@achanam.com">dev@achanam.com</a>.',

    closingSign: "Hormat saya,",
    closingName: "Ach Anam",
    closingDate: "21 Juni 2026",
  },
};
