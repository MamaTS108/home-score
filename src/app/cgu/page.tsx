import { SiteHeader } from "@/components/layout/SiteHeader";

export default function CguPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Conditions générales d&apos;utilisation</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Document indicatif — à faire relire et compléter par un professionnel du droit avant toute mise en
          production réelle.
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="font-semibold mb-2">1. Objet</h2>
            <p>
              Teelte est un outil d&apos;aide à la planification de rénovation intérieure assisté par IA. Il fournit
              des visualisations, des estimations de travaux et de budget à titre indicatif uniquement.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">2. Nature des estimations</h2>
            <p>
              Les quantités, prix, délais et visualisations générés par Teelte sont des estimations basées sur une
              analyse automatisée de photos et de descriptions fournies par l&apos;utilisateur. Ils ne constituent ni
              un devis professionnel, ni un diagnostic technique, ni un plan architectural, et doivent être vérifiés
              avant tout achat ou engagement de travaux.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">3. Compte utilisateur</h2>
            <p>
              L&apos;utilisateur est responsable de la confidentialité de ses identifiants de connexion et de
              l&apos;exactitude des informations fournies lors de son inscription.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">4. Données personnelles</h2>
            <p>
              Les données transmises (photos, descriptions de projet, informations de contact) sont utilisées pour
              fournir le service et améliorer l&apos;expérience utilisateur. Elles ne sont pas revendues à des
              tiers.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">5. Responsabilité</h2>
            <p>
              Teelte ne saurait être tenu responsable des décisions prises sur la base des estimations fournies. Il
              appartient à l&apos;utilisateur de faire valider tout projet par un professionnel qualifié avant
              exécution.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">6. Modification des conditions</h2>
            <p>
              Ces conditions peuvent être modifiées à tout moment. La version en vigueur est celle publiée sur cette
              page au moment de l&apos;utilisation du service.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
