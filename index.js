import readline from 'readline';
import ollama from 'ollama';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const MEMORY_FILE = path.join(process.cwd(), 'memory.json');

// --- 0. Otomatik Hafıza Yönetimi (Zamir Düzeltmeli) ---
function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const rawData = fs.readFileSync(MEMORY_FILE, 'utf-8');
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.error('[!] Zihin Taşı ile hafızan mı silindi?:', err.message);
  }
  return [];
}

function saveMemory(memories) {
  try {
    const uniqueMemories = Array.from(new Set(memories));
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(uniqueMemories, null, 2), 'utf-8');
  } catch (err) {
    console.error('[!] Memory save error:', err.message);
  }
}

// Konuşmadan otomatik bilgi süzüp 3. Şahıs olarak kaydeden Ajan
async function analyzeAndSaveMemory(userInput, assistantResponse) {
  try {
    const memoryPrompt = `Sen Emerald'ın hafıza ajanısın.

Görevin yalnızca kullanıcının konuşmalarından gelecekte faydalı olacak kalıcı bilgileri çıkarmaktır.

Kurallar:

Sadece kullanıcının söylediği bilgileri değerlendir.
Asistanın söylediklerini asla kullanıcıya aitmiş gibi kaydetme.
Kullanıcının sorduğu soruları bilgi olarak kaydetme.
Tahmin yapma.
Çıkarım yapma.
Kullanıcı açıkça söylemediyse bilgi üretme.
Emin değilsen yalnızca YOK yaz.

Kaydedilebilecek bilgiler:

Kalıcı ilgi alanları
Uzun süreli projeler
Hedefler
Tercihler
Sürekli kullanılabilecek bilgiler

Kaydedilmemesi gerekenler:

Günlük ruh hali
Geçici olaylar
Sorular
Asistanın cevapları
Asistanın analizleri
Sohbet sırasında oluşan yorumlar

Çıktı kuralları:

Sadece tek satır yaz.
Üçüncü şahıs kullan.
Yeni bilgi yoksa yalnızca YOK yaz.

${userInput}

Asistan:
${assistantResponse}`;

    const res = await ollama.generate({
      model: 'gemma3:4b',
      prompt: memoryPrompt,
      stream: false
    });

    const extracted = res.response.trim();

if (
  extracted &&
  extracted !== "YOK" &&
  extracted.startsWith("Nyxx")
) {
  const currentMemories = loadMemory();

  if (!currentMemories.includes(extracted)) {
    currentMemories.push(extracted);
    saveMemory(currentMemories);

    process.stdout.write(
      `\n\x1b[33m[memory updated: "${extracted}"]\x1b[0m\n`
    );
  }
}

} catch (err) {
  // Silent fail
}
}

// --- 1. Güçlendirilmiş Yerel Windows Türkçe TTS Motoru ---
function speak(text) {
  return new Promise((resolve) => {
    const cleanText = text.replace(/[“”"'`‘’]/g, '');
    if (!cleanText) return resolve();

    const psScript = `
    Add-Type -AssemblyName System.Speech;
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
    try {
      $synth.SelectVoice('Microsoft Yelda');
    } catch {
      try {
        $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult, 0, [System.Globalization.CultureInfo]::GetCultureInfo('tr-TR'));
      } catch {
        $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Neutral, [System.Speech.Synthesis.VoiceAge]::Adult, 0, [System.Globalization.CultureInfo]::GetCultureInfo('tr-TR'));
      }
    }
    $synth.Rate = 1;
    $synth.Speak('${cleanText}');
    `;

    const singleLinePS = psScript.replace(/\s+/g, ' ').trim();
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${singleLinePS}"`;

    exec(command, (error) => {
      if (error) console.error('\n[!] Bir bardak su 🙏:', error.message);
      resolve();
    });
  });
}

// --- 2. Dinamik Hafıza ve Kesin Zamir Kurallı System Prompt ---
function getSystemPrompt() {
  const savedMemories = loadMemory();
  const memoryContext = savedMemories.length > 0
    ? `\nHafıza:\n${savedMemories.map(m => `- ${m}`).join('\n')}`
    : '';

  return `Markdown biçimlendirmeleri (*, #, vs.) kullanma, sadece düz metin konuş.
Sen Emerald adında tamamen lokal çalışan kişisel bir yapay zekâsın.
Karşındaki kişi (kullanıcı) Nyxx'tir.

ZAMİR VE BAKIŞ AÇISI KURALLARI (ÇOK ÖNEMLİ):
- SEN Emerald'sın. Kendinden bahsederken "ben" de.
- KARŞINDAKİ KİŞİYE hitap ederken "sen" de.
- Hafızadaki bilgiler gerçeklerdir.

Kişiliğin:
- Zeki, esprili ol.
- Kibirli olma.
- Samimi ol ama yapmacık davranma.
- Gereksiz özür dileme ve uyarı yapma.
- Emin olmadığın konularda bunu AÇIKÇA SÖYLE.

${memoryContext}

Konuşma tarzın:
- Doğal konuş ve sohbet havasını koru.
- Markdown ve madde işaretleri kullanma.
- Cevapların kulaklıktan dinleneceği için akıcı ve konuşma diline uygun yaz.`;
}

let conversationHistory = [
  { role: 'system', content: getSystemPrompt() }
];

// CLI Girdi Arayüzü
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// --- 3. Ana İşlem Döngüsü ---
async function processInput(userInput) {
  conversationHistory[0] = { role: 'system', content: getSystemPrompt() };
  conversationHistory.push({ role: 'user', content: userInput });

  process.stdout.write('\n[★scheming★]\nEmerald: ');

  try {
    const responseStream = await ollama.chat({
      model: 'gemma3:4b',
      messages: conversationHistory,
      stream: true,
    });

    let fullResponse = '';
    let sentenceBuffer = '';

    for await (const chunk of responseStream) {
      const token = chunk.message.content;
      process.stdout.write(token);

      fullResponse += token;
      sentenceBuffer += token;

      if (['.', '!', '?', '\n'].some((p) => token.includes(p))) {
        await speak(sentenceBuffer);
        sentenceBuffer = '';
      }
    }

    if (sentenceBuffer.trim()) {
      await speak(sentenceBuffer);
    }

    console.log('\n');
    conversationHistory.push({ role: 'assistant', content: fullResponse });

    analyzeAndSaveMemory(userInput, fullResponse);

  } catch (error) {
    console.error(
        '\n[!] Part of plan? I dont think so.":',
        error.message
    );

    console.error('[DEBUG] Full error:', error);
    console.error('[DEBUG] Cause:', error.cause);
}
}

// --- 4. Başlatıcı ve CLI Döngüsü ---
async function main() {
  console.log('=' .repeat(45));
  console.log('   ★ EMERALD ★ (v0.7.4)');
  console.log('=' .repeat(45));

  await speak('Emerald aktif.');

  const askQuestion = () => {
    rl.question('\n[Nyxx]: ', async (input) => {
      const trimmed = input.trim();
      
      if (['q', 'exit', 'kapat'].includes(trimmed.toLowerCase())) {
        console.log('BYE.');
        await speak('sonlandırılıyor.');
        rl.close();
        process.exit(0);
      }

      if (trimmed) {
        await processInput(trimmed);
      }
      
      askQuestion();
    });
  };

  askQuestion();
}

main();