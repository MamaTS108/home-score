import { getResend, EMAIL_FROM, ADMIN_EMAIL } from "./resend";

const CATEGORY_LABELS: Record<string, string> = {
  sol: "Sol",
  peinture: "Peinture",
  eclairage: "Éclairage",
  mobilier: "Mobilier",
  cuisine: "Cuisine",
  salle_de_bain: "Salle de bain",
  isolation: "Isolation",
  fenetres: "Fenêtres",
  chauffage: "Chauffage",
  decoration: "Décoration",
};

/**
 * All email sends here are best-effort: a failed email must never break the
 * actual feature (the interest was already saved in the database before
 * this is called). Errors are logged, not thrown.
 */
async function sendSafely(fn: () => Promise<unknown>, context: string) {
  try {
    await fn();
  } catch (error) {
    console.error(`Email send failed (${context})`, error);
  }
}

export async function notifyProductInterest(params: { userEmail: string | null; categories: string[] }) {
  const { userEmail, categories } = params;
  const labels = categories.map((c) => CATEGORY_LABELS[c] ?? c).join(", ");
  const resend = getResend();

  if (userEmail) {
    await sendSafely(
      () =>
        resend.emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: "Teelte : Votre demande a bien été enregistrée",
          html: `<p>Merci ! Nous vous préviendrons dès que notre sélection de produits sera disponible.</p><p>Catégories qui vous intéressent : <strong>${labels}</strong></p>`,
        }),
      "product interest user confirmation"
    );
  }

  if (ADMIN_EMAIL) {
    await sendSafely(
      () =>
        resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `Nouvelle demande produits : ${labels}`,
          html: `<p>Nouvelle demande d'intérêt produits.</p><p>Email : ${userEmail ?? "anonyme"}</p><p>Catégories : <strong>${labels}</strong></p>`,
        }),
      "product interest admin notification"
    );
  }
}

export async function notifyArtisanInterest(params: {
  userEmail: string | null;
  workType: string | null;
  location: string | null;
}) {
  const { userEmail, workType, location } = params;
  const resend = getResend();

  if (userEmail) {
    await sendSafely(
      () =>
        resend.emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: "Teelte : Votre demande a bien été enregistrée",
          html: `<p>Merci ! Nous vous contacterons dès qu'un professionnel sera disponible dans votre zone.</p>`,
        }),
      "artisan interest user confirmation"
    );
  }

  if (ADMIN_EMAIL) {
    await sendSafely(
      () =>
        resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `Nouvelle demande artisan${location ? `, ${location}` : ""}`,
          html: `<p>Nouvelle demande de mise en relation avec un artisan.</p><p>Email : ${userEmail ?? "anonyme"}</p><p>Travaux : ${workType ?? "non précisé"}</p><p>Localisation : ${location ?? "non précisée"}</p>`,
        }),
      "artisan interest admin notification"
    );
  }
}
