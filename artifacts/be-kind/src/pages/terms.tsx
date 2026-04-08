import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">Termini e Condizioni</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">Condizioni Generali di Vendita</h2>
              <p className="text-xs text-muted-foreground">Ristorante Be Kind — Cattolica (RN)</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">1. Oggetto</h3>
            <p>Le presenti Condizioni Generali disciplinano l'acquisto di prodotti alimentari e servizi di ristorazione tramite l'applicazione Be Kind, gestita da Ristorante Be Kind, con sede in Cattolica (RN).</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">2. Prezzi e IVA</h3>
            <p>Tutti i prezzi indicati sono in Euro (€) e si intendono comprensivi di IVA al 10% (aliquota ridotta per somministrazione alimenti e bevande, D.P.R. 633/1972, Tabella A, Parte III, n. 121). Il costo della consegna, ove applicabile, è indicato separatamente.</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">3. Ordini e Pagamenti</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gli ordini possono essere pagati tramite carta di credito/debito (gestita da Stripe) o in contanti alla consegna/ritiro</li>
              <li>L'ordine è confermato solo dopo l'avvenuto pagamento o la conferma del metodo di pagamento in contanti</li>
              <li>In caso di pagamento con carta, l'addebito avviene immediatamente alla conferma dell'ordine</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">4. Consegna</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>La consegna a domicilio è disponibile nell'area di Cattolica e comuni limitrofi</li>
              <li>I tempi di consegna sono indicativi (generalmente 30-45 minuti)</li>
              <li>La consegna è gratuita per ordini superiori a €25, altrimenti ha un costo di €2,50</li>
              <li>Il ritiro (asporto) è gratuito presso il ristorante</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">5. Diritto di Recesso</h3>
            <p>Ai sensi dell'art. 59, comma 1, lettera d) ed e) del Codice del Consumo (D.Lgs. 206/2005), il diritto di recesso non si applica ai contratti di fornitura di prodotti alimentari deperibili o confezionati su misura.</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">6. Documentazione Fiscale</h3>
            <p>Per ogni ordine viene emessa documentazione fiscale ai sensi della normativa vigente. Su richiesta, è possibile ricevere fattura elettronica fornendo il proprio Codice Fiscale o P.IVA e Codice Destinatario/PEC in fase di ordine.</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">7. Programma Fedeltà</h3>
            <p>Il programma fedeltà Be Kind prevede l'accumulo di punti (1 punto per ogni €1 speso). I punti e i livelli non hanno valore monetario e non sono trasferibili. Be Kind si riserva di modificare le condizioni del programma con preavviso di 30 giorni.</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground text-base mb-2">8. Foro Competente</h3>
            <p>Per qualsiasi controversia relativa alle presenti condizioni è competente in via esclusiva il Foro di Rimini. È fatta salva la competenza inderogabile del foro del consumatore ai sensi dell'art. 66-bis del Codice del Consumo.</p>
          </div>

          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">Ultimo aggiornamento: Aprile 2026</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
