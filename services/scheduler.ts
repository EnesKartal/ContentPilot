import {
  createLinkedinPost,
  extractTagsAndSeries,
  generateMarkdownPost,
  getDynamicCategories,
  getTitleForCategory,
} from "./ai";
import { publishToDevto } from "./devto";
import { sharePostOnLinkedIn } from "./linkedin";
import { sendEmail } from "./sendEmail";
import { retry } from "./utils";

export async function dailyContentBlast(purposes: string[]) {
  try {
    console.log("📚 Kategoriler alınıyor...");
    const categories = await retry(() => getDynamicCategories(purposes));

    const category = categories[Math.floor(Math.random() * categories.length)];
    console.log("🎯 Seçilen kategori:", category);

    const title = await retry(() => getTitleForCategory(category));
    console.log("📝 Başlık:", title);

    const markdown = await retry(() => generateMarkdownPost(title));
    console.log("✍️ Yazı oluşturuldu, yayınlanıyor...");

    const { tags, series } = await retry(() => extractTagsAndSeries(markdown));

    const devToUrl = await retry(() =>
      publishToDevto(title, markdown, tags, series)
    );

    const linkedinText = await retry(() =>
      createLinkedinPost(markdown, devToUrl, tags, series)
    );
    console.log("🔗 LinkedIn paylaşım metni oluşturuldu.");

    const linkedinResponse = await retry(() =>
      sharePostOnLinkedIn(linkedinText)
    );
    console.log("🔗 LinkedIn paylaşım yapıldı:", linkedinResponse);
  } catch (err) {
    console.error("🚨 Sistem durdu:", err);

    let errorMessage = "";
    if (err instanceof Error) {
      errorMessage = `Hata yeri:\n${err.stack}`;
      errorMessage += `\n\nHata mesajı:\n${err.message}`;
    } else {
      errorMessage = `Hata mesajı (tipi tanımsız):\n${JSON.stringify(err)}`;
    }

    await sendEmail(
      `🚨 Hata! Post Paylaşılamadı ${new Date().toLocaleString()}`,
      `Hata mesajı:\n${errorMessage}`
    );
  }
}
