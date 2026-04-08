import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">Informativa Privacy</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">Informativa sul Trattamento dei Dati Personali</h2>
              <p className="text-xs text-muted-foreground">ai sensi dell'art. 13 del Regolamento (UE) 2016/679 (GDPR)</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">1. Titolare del Trattamento</h3>
            <p>Il Titolare del trattamento è <strong className="text-foreground">Ristorante Be Kind</strong>, con sede in Via [Indirizzo], 47841 Cattolica (RN), Italia. P.IVA: [Numero P.IVA]. Email: info@bekindcommunity.it</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">2. Finalità e Base Giuridica del Trattamento</h3>
            <p>I dati personali raccolti sono trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Gestione degli ordini</strong> (base giuridica: esecuzione del contratto, art. 6.1.b GDPR) — nome, indirizzo di consegna, numero di telefono, email, codice fiscale (se richiesta fattura)</li>
              <li><strong className="text-foreground">Programma fedeltà</strong> (base giuridica: consenso, art. 6.1.a GDPR) — storico ordini, punti accumulati, livello</li>
              <li><strong className="text-foreground">Gestione prenotazioni</strong> (base giuridica: esecuzione del contratto) — data, ora, numero ospiti, preferenze</li>
              <li><strong className="text-foreground">Comunicazioni di servizio</strong> (base giuridica: legittimo interesse, art. 6.1.f GDPR) — conferme ordine, aggiornamenti stato</li>
              <li><strong className="text-foreground">Obblighi fiscali</strong> (base giuridica: obbligo legale, art. 6.1.c GDPR) — emissione ricevute e fatture secondo la normativa italiana</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">3. Dati Raccolti</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dati identificativi: nome, cognome, email</li>
              <li>Dati di contatto: indirizzo di consegna, telefono</li>
              <li>Dati fiscali: codice fiscale (solo se richiesta fattura)</li>
              <li>Dati di pagamento: gestiti esclusivamente da Stripe Inc., certificato PCI-DSS Level 1. Non conserviamo dati di carte di credito.</li>
              <li>Dati di navigazione: cookie tecnici necessari al funzionamento</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">4. Pagamenti e Sicurezza</h3>
            <p>I pagamenti online sono gestiti da <strong className="text-foreground">Stripe Inc.</strong>, fornitore certificato PCI-DSS Level 1. I dati della carta di credito non transitano e non sono conservati sui nostri server. Per maggiori informazioni: <a href="https://stripe.com/it/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">5. Periodo di Conservazione</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dati dell'account: per tutta la durata dell'account e fino a 30 giorni dalla cancellazione</li>
              <li>Dati degli ordini: 10 anni (obbligo fiscale ex art. 2220 c.c.)</li>
              <li>Dati del programma fedeltà: fino alla cancellazione dell'account</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">6. Diritti dell'Interessato</h3>
            <p>In conformità agli articoli 15-22 del GDPR, hai il diritto di:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Accedere ai tuoi dati personali</li>
              <li>Rettificare dati inesatti</li>
              <li>Cancellare i tuoi dati ("diritto all'oblio")</li>
              <li>Limitare il trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Opporti al trattamento</li>
              <li>Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p className="mt-2">Per esercitare i tuoi diritti, scrivi a: <strong className="text-foreground">info@bekindcommunity.it</strong></p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">7. Trasferimento dei Dati</h3>
            <p>I dati di pagamento sono trattati da Stripe Inc. (USA) nel rispetto delle Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea, ai sensi dell'art. 46 GDPR.</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">8. Cookie</h3>
            <p>L'applicazione utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio (autenticazione, sessione). Non vengono utilizzati cookie di profilazione o di terze parti per finalità pubblicitarie.</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">9. Reclami</h3>
            <p>Hai il diritto di proporre reclamo all'Autorità Garante per la Protezione dei Dati Personali: <a href="https://www.garanteprivacy.it" className="text-primary underline" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a></p>
          </div>

          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">Ultimo aggiornamento: Aprile 2026</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
