document.addEventListener("DOMContentLoaded", () => {
  // --- 1. GEREKLİ DEĞİŞKENLER VE HTML ELEMENTLERİ ---

  let tumSorular = [];
  let mevcutSoruIndex = 0;
  let kullaniciCevaplari = [];

  // Zamanlayıcı için global değişken
  let timerInterval = null;
  let toplamSure = 15 * 60; // 15 dakika * 60 saniye = 900 saniye

  // HTML'den gerekli elementleri seçiyoruz
  const soruMetniElementi = document.getElementById("question-text");
  const seceneklerKonteyneri = document.getElementById("options-container");
  const sonrakiSoruButonu = document.getElementById("next-button");
  const oncekiSoruButonu = document.getElementById("prev-button");

  const ilerlemeCizgisiElementi = document.querySelector(".progress-bar");
  const ilerlemeSayaciElementi = document.getElementById("question-counter");
  const ilerlemeYuzdeElementi = document.getElementById("progress-percent");

  // Zamanlayıcı ve Modal elementleri
  const timerDisplayElement = document.getElementById("timer-display");
  const sureBittiModalElement = document.getElementById("sureBittiModal");
  // Bootstrap Modal'ını JS ile kontrol etmek için bir örnek (instance) oluştur
  const sureBittiModal = new bootstrap.Modal(sureBittiModalElement, {
    backdrop: "static",
    keyboard: false,
  });

  // --- 2. JSON DOSYASINI ÇEKME (FETCH API) ---

  fetch("sorular.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      tumSorular = data;
      kullaniciCevaplari = new Array(tumSorular.length).fill(null);
      soruyuGoster(mevcutSoruIndex);

      //Sorular yüklendikten sonra zamanlayıcıyı başlat
      startTimer();
    })
    .catch((error) => {
      console.error("Sorular yüklenirken hata oluştu:", error);
      soruMetniElementi.textContent =
        "Quiz yüklenirken bir hata oluştu. Lütfen konsolu kontrol edin.";
    });

  // --- 3. SORUYU GÖSTERME FONKSİYONU ---

  function soruyuGoster(index) {
    const soru = tumSorular[index];
    const mevcutCevap = kullaniciCevaplari[index];

    soruMetniElementi.textContent = soru.soru;

    const ilerlemeYuzdesi = Math.round(((index + 1) / tumSorular.length) * 100);
    ilerlemeSayaciElementi.textContent = `Soru ${index + 1} / ${
      tumSorular.length
    }`;
    ilerlemeYuzdeElementi.textContent = `${ilerlemeYuzdesi}%`;

    ilerlemeCizgisiElementi.style.width = `${ilerlemeYuzdesi}%`;
    ilerlemeCizgisiElementi.setAttribute("aria-valuenow", ilerlemeYuzdesi);
    if (ilerlemeCizgisiElementi.textContent !== undefined) {
      ilerlemeCizgisiElementi.textContent = `${ilerlemeYuzdesi}%`;
    }

    seceneklerKonteyneri.innerHTML = "";

    for (const key in soru.secenekler) {
      const secenekMetni = soru.secenekler[key];
      const isChecked = key === mevcutCevap ? "checked" : "";

      const label = document.createElement("label");
      label.className = "option-card";
      label.htmlFor = `option-${key}`;
      label.innerHTML = `
        <input class="form-check-input" type="radio" name="quizOptions" id="option-${key}" value="${key}" ${isChecked}>
        <span class="option-text">${key.toUpperCase()}) ${secenekMetni}</span>
        <i class="bi bi-check-circle-fill check-icon"></i>
      `;
      seceneklerKonteyneri.appendChild(label);
    }

    // 4. Radio Buton Olay Dinleyicileri
    document.querySelectorAll('input[name="quizOptions"]').forEach((radio) => {
      radio.addEventListener("change", (event) => {
        kullaniciCevaplari[mevcutSoruIndex] = event.target.value;
        // DEĞİŞİKLİK: 'sonrakiSoruButonu.disabled = false;' satırı buradan kaldırıldı.
      });
    });

    // 5. Buton Durumlarını Yönetme
    sonrakiSoruButonu.disabled = false;

    // 'Önceki' butonu ilk soruda pasif olmalı
    oncekiSoruButonu.disabled = index === 0;

    if (index === tumSorular.length - 1) {
      sonrakiSoruButonu.innerHTML =
        'Testi Bitir <i class="bi bi-check-lg ms-1"></i>';
    } else {
      sonrakiSoruButonu.innerHTML =
        'Sonraki <i class="bi bi-arrow-right-circle ms-1"></i>';
    }
  }

  // --- 4. BUTON OLAYLARI ---

  oncekiSoruButonu.addEventListener("click", () => {
    if (mevcutSoruIndex > 0) {
      mevcutSoruIndex--;
      soruyuGoster(mevcutSoruIndex);
    }
  });

  sonrakiSoruButonu.addEventListener("click", () => {
    mevcutSoruIndex++;
    if (mevcutSoruIndex < tumSorular.length) {
      soruyuGoster(mevcutSoruIndex);
    } else {
      // Test bittiyse, zamanlayıcıyı durdur ve sonuçları göster
      clearInterval(timerInterval);
      hesaplaVeSonuclariGoster();
    }
  });

  // YENİ: Modal'daki "Sonuçları Gönder" butonunun olayı
  document.getElementById("gonderButton").addEventListener("click", () => {
    sureBittiModal.hide(); // Modalı gizle
    hesaplaVeSonuclariGoster(); // Sonuçları hesapla
  });

  // --- 5. YENİ ZAMANLAYICI FONKSİYONU ---

  function startTimer() {
    // Her 1 saniyede (1000ms) bir çalışacak fonksiyonu ayarla
    timerInterval = setInterval(() => {
      // Süreyi saniyeden Dakika:Saniye formatına çevir
      let dakika = Math.floor(toplamSure / 60);
      let saniye = toplamSure % 60;

      // Saniye 10'dan küçükse başına '0' ekle (örn: 09, 08...)
      saniye = saniye < 10 ? "0" + saniye : saniye;
      dakika = dakika < 10 ? "0" + dakika : dakika;

      // HTML'deki zamanlayıcıyı güncelle
      timerDisplayElement.innerHTML = `<i class="bi bi-stopwatch"></i> ${dakika}:${saniye}`;
      if (toplamSure > 0) {
        toplamSure--;
      } else {
        clearInterval(timerInterval); // Zamanlayıcıyı durdur
        timerDisplayElement.textContent = "Süre Bitti!";

        // YENİ: Süre bitti modalını göster
        sureBittiModal.show();

        // YENİ: Test butonlarını pasif yap
        sonrakiSoruButonu.disabled = true;
        oncekiSoruButonu.disabled = true;
      }
    }, 1000); // 1000ms = 1 saniye
  }

  // --- 6. QUIZ BİTİŞ FONKSİYONU  ---

  function hesaplaVeSonuclariGoster() {
    clearInterval(timerInterval);

    let kullaniciSkoru = 0;
    for (let i = 0; i < tumSorular.length; i++) {
      if (kullaniciCevaplari[i] === tumSorular[i].dogruCevap) {
        kullaniciSkoru++;
      }
    }

    const cardBody = document.querySelector(".quiz-body");
    const cardFooter = document.querySelector(".quiz-footer");
    const cardHeader = document.querySelector(".quiz-header");

    cardHeader.innerHTML = `<h3 class="text-center fw-bold text-primary">Test Sonucu</h3>`;

    cardBody.innerHTML = `
        <div class="text-center py-4">
            <i class="bi bi-award-fill display-1 text-success"></i>
            <h2 class="fw-bold mt-3">Testi Tamamladınız!</h2>
            <p class="fs-4 text-center mt-4">
                Toplam ${tumSorular.length} sorudan 
                <strong class="text-success display-6 d-block my-2">${kullaniciSkoru}</strong> tanesini doğru cevapladınız.
            </p>
        </div>
    `;

    cardFooter.innerHTML = `
        <div class="text-center w-100">
            <button class="btn btn-primary btn-lg" onclick="location.reload()">
                <i class="bi bi-arrow-repeat me-1"></i> Testi Yeniden Başlat
            </button>
            <button class="btn btn-secondary btn-lg ms-4" onclick="location.href='dashboard.html'">
                <i class="bi bi-house-door-fill me-1"></i> Ana Menüye Dön
            </button>
        </div>
    `;
  }
});
