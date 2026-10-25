# Test verisi

- `bmo-legacy.json`: Eski (BMO Learn) biçiminde **sahte** ama gerçekçi bir localStorage dökümü. Sayı ve ondalıklı id'ler, `id`'siz eski geçmiş kayıtları, koleksiyon, PDF, UTC tarihli pomodoro kayıtları içerir.
- `bmo-corrupt.json`: Aynı döküm; bozuk JSON (`bmo_notes`) ve şemaya uymayan bir soru (`bmo_quiz`, nesne şıklar) içerir.

Gerçek bir dökümle test etmek için dosyayı `fixtures/local/bmo-dump.json` olarak koyun. Bu klasör `.gitignore`'dadır ve **commit edilmez**.

Biçim: `{ "bmo_notes": "<localStorage'daki ham string>", ... }`. Tarayıcı konsolunda şöyle alınabilir:

```js
copy(JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith('bmo_')))));
```
