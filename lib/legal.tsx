import { getLocale } from "@/lib/i18n/server";

export type LegalSlug =
  | "privacy"
  | "terms"
  | "cookies"
  | "shipping"
  | "returns";

type LegalDoc = {
  title: string;
  updated: string;
  sections: Array<{ heading: string; body: string }>;
};

const el: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Πολιτική απορρήτου",
    updated: "Τελευταία ενημέρωση: Σεπτέμβριος 2026",
    sections: [
      {
        heading: "1. Ποιοι είμαστε",
        body: "Η SoYoung («εμείς») λειτουργεί το ηλεκτρονικό κατάστημα soyoung και είναι υπεύθυνη επεξεργασίας των προσωπικών δεδομένων σας σύμφωνα με τον Κανονισμό (ΕΕ) 2016/679 (GDPR) και την ελληνική νομοθεσία.",
      },
      {
        heading: "2. Τι δεδομένα συλλέγουμε",
        body: "Συλλέγουμε στοιχεία λογαριασμού και επικοινωνίας (όνομα, email, τηλέφωνο), διευθύνσεις αποστολής, ιστορικό παραγγελιών, δεδομένα πληρωμής μέσω του παρόχου Viva.com (χωρίς αποθήκευση πλήρων στοιχείων κάρτας στους διακομιστές μας), καθώς και τεχνικά δεδομένα (cookies, διεύθυνση IP, τύπος συσκευής) για ασφάλεια και λειτουργία της ιστοσελίδας.",
      },
      {
        heading: "3. Γιατί τα επεξεργαζόμαστε",
        body: "Επεξεργαζόμαστε δεδομένα για εκτέλεση παραγγελιών και σύμβασης, διαχείριση λογαριασμού, εξυπηρέτηση πελατών, συμμόρφωση με νομικές υποχρεώσεις (π.χ. φορολογία), πρόληψη απάτης και — μόνο με τη συγκατάθεσή σας — για προαιρετικά cookies ανάλυσης/marketing.",
      },
      {
        heading: "4. Νομική βάση",
        body: "Εκτέλεση σύμβασης, έννομο συμφέρον (ασφάλεια, βελτίωση υπηρεσίας), νομική υποχρέωση και συγκατάθεση όπου απαιτείται (μη απαραίτητα cookies, newsletter).",
      },
      {
        heading: "5. Διαβιβάσεις & διατηρητές",
        body: "Μοιραζόμαστε δεδομένα με παρόχους που μας βοηθούν να λειτουργούμε το κατάστημα (φιλοξενία, πληρωμές Viva.com, αποστολές, email). Όπου δεδομένα εξέρχονται του ΕΟΧ, εφαρμόζουμε κατάλληλες εγγυήσεις. Δεν πωλούμε προσωπικά δεδομένα.",
      },
      {
        heading: "6. Χρόνος διατήρησης",
        body: "Διατηρούμε δεδομένα παραγγελιών όσο απαιτείται από τη φορολογική/εμπορική νομοθεσία και για όσο διαρκεί ο λογαριασμός σας. Cookies και προτιμήσεις συγκατάθεσης διατηρούνται σύμφωνα με την πολιτική cookies.",
      },
      {
        heading: "7. Τα δικαιώματά σας",
        body: "Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας, εναντίωσης και ανάκλησης συγκατάθεσης. Μπορείτε επίσης να υποβάλετε καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (www.dpa.gr).",
      },
      {
        heading: "8. Επικοινωνία",
        body: "Για αιτήματα απορρήτου: privacy@soyoung.example.",
      },
    ],
  },
  terms: {
    title: "Όροι χρήσης",
    updated: "Τελευταία ενημέρωση: Σεπτέμβριος 2026",
    sections: [
      {
        heading: "1. Γενικά",
        body: "Με την πρόσβαση και χρήση του καταστήματος SoYoung αποδέχεστε τους παρόντες όρους. Αν δεν συμφωνείτε, μην χρησιμοποιείτε την υπηρεσία.",
      },
      {
        heading: "2. Λογαριασμός",
        body: "Είστε υπεύθυνοι για την ακρίβεια των στοιχείων σας και την εμπιστευτικότητα του κωδικού πρόσβασης. Διατηρούμε δικαίωμα αναστολής λογαριασμών σε περίπτωση κατάχρησης.",
      },
      {
        heading: "3. Παραγγελίες & τιμές",
        body: "Οι τιμές εμφανίζονται σε ευρώ και ενδέχεται να περιλαμβάνουν ή να αποκλείουν ΦΠΑ σύμφωνα με τη σήμανση στο checkout. Η παραγγελία αποτελεί πρόταση αγοράς· η αποδοχή επιβεβαιώνεται με email/κατάσταση παραγγελίας. Διατηρούμε δικαίωμα ακύρωσης σε περίπτωση σφάλματος τιμής ή εξάντλησης αποθέματος.",
      },
      {
        heading: "4. Πληρωμές",
        body: "Οι πληρωμές με κάρτα διεκπεραιώνονται μέσω Viva.com. Η ολοκλήρωση πληρωμής αποτελεί προϋπόθεση αποστολής, εκτός αν άλλως δηλώνεται.",
      },
      {
        heading: "5. Πνευματική ιδιοκτησία",
        body: "Περιεχόμενο, σήματα και σχέδια της SoYoung προστατεύονται. Απαγορεύεται η αναπαραγωγή χωρίς άδεια.",
      },
      {
        heading: "6. Ευθύνη",
        body: "Στο μέγιστο βαθμό που επιτρέπει ο νόμος, δεν ευθυνόμαστε για έμμεσες ζημίες από χρήση της ιστοσελίδας. Τίποτα στους όρους δεν περιορίζει δικαιώματα καταναλωτή που δεν μπορούν να αποκλειστούν.",
      },
      {
        heading: "7. Εφαρμοστέο δίκαιο",
        body: "Εφαρμόζεται το δίκαιο της Ελληνικής Δημοκρατίας. Αρμόδια είναι τα δικαστήρια της Αθήνας, με επιφύλαξη δικαιωμάτων καταναλωτή στον τόπο κατοικίας του.",
      },
    ],
  },
  cookies: {
    title: "Πολιτική cookies",
    updated: "Τελευταία ενημέρωση: Σεπτέμβριος 2026",
    sections: [
      {
        heading: "1. Τι είναι τα cookies",
        body: "Τα cookies είναι μικρά αρχεία που αποθηκεύονται στη συσκευή σας για να λειτουργεί σωστά η ιστοσελίδα και να θυμάται προτιμήσεις.",
      },
      {
        heading: "2. Απαραίτητα cookies",
        body: "Χρησιμοποιούνται πάντα για σύνδεση, ασφάλεια, γλώσσα, καλάθι και βασική λειτουργία. Δεν απαιτούν συγκατάθεση.",
      },
      {
        heading: "3. Προαιρετικά cookies",
        body: "Cookies ανάλυσης ή marketing ενεργοποιούνται μόνο αν πατήσετε «Αποδοχή». Με «Απόρριψη» παραμένουν μόνο τα απαραίτητα.",
      },
      {
        heading: "4. Διαχείριση",
        body: "Μπορείτε να αλλάξετε προτίμηση διαγράφοντας τα δεδομένα του ιστότοπου στο πρόγραμμα περιήγησης ή επικοινωνώντας μαζί μας. Περισσότερα στην πολιτική απορρήτου.",
      },
    ],
  },
  shipping: {
    title: "Αποστολές",
    updated: "Τελευταία ενημέρωση: Σεπτέμβριος 2026",
    sections: [
      {
        heading: "1. Περιοχές",
        body: "Αποστέλλουμε στην Ελλάδα και σε χώρες της ΕΕ, εκτός αν άλλως δηλώνεται στο checkout.",
      },
      {
        heading: "2. Χρόνοι",
        body: "Τυπικός χρόνος παράδοσης 2–5 εργάσιμες ημέρες εντός Ελλάδας μετά την επιβεβαίωση πληρωμής. Διεθνείς χρόνοι ενδέχεται να διαφέρουν.",
      },
      {
        heading: "3. Κόστος",
        body: "Τα μεταφορικά υπολογίζονται στο ταμείο. Παραγγελίες άνω του ορίου δωρεάν αποστολής (όπως εμφανίζεται στο κατάστημα) έχουν μηδενικά μεταφορικά εντός των καλυπτόμενων περιοχών.",
      },
      {
        heading: "4. Καθυστερήσεις",
        body: "Καθυστερήσεις από μεταφορείς ή τελωνεία είναι εκτός ελέγχου μας· θα σας ενημερώνουμε όταν έχουμε διαθέσιμη πληροφορία παρακολούθησης.",
      },
    ],
  },
  returns: {
    title: "Επιστροφές",
    updated: "Τελευταία ενημέρωση: Σεπτέμβριος 2026",
    sections: [
      {
        heading: "1. Δικαίωμα υπαναχώρησης",
        body: "Για αγορές εξ αποστάσεως έχετε δικαίωμα υπαναχώρησης εντός 14 ημερών από την παραλαβή, σύμφωνα με την ευρωπαϊκή/ελληνική νομοθεσία καταναλωτή, με τις νόμιμες εξαιρέσεις (π.χ. σφραγισμένα προϊόντα υγιεινής που αποσφραγίστηκαν).",
      },
      {
        heading: "2. Κατάσταση προϊόντων",
        body: "Τα προϊόντα πρέπει να επιστρέφονται αχρησιμοποίητα, στην αρχική συσκευασία όπου είναι εφικτό, με απόδειξη αγοράς.",
      },
      {
        heading: "3. Διαδικασία",
        body: "Επικοινωνήστε στο returns@soyoung.example με αριθμό παραγγελίας. Μετά την έγκριση θα λάβετε οδηγίες αποστολής. Η επιστροφή χρημάτων γίνεται στη μέθοδο πληρωμής εντός εύλογου χρόνου μετά τον έλεγχο.",
      },
      {
        heading: "4. Ελαττωματικά",
        body: "Για ελαττωματικά ή λανθασμένα προϊόντα καλύπτουμε τα έξοδα επιστροφής/αντικατάστασης σύμφωνα με τον νόμο.",
      },
    ],
  },
};

const en: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Privacy policy",
    updated: "Last updated: September 2026",
    sections: [
      {
        heading: "1. Who we are",
        body: "SoYoung (“we”) operates this online store and is the controller of your personal data under the EU GDPR and applicable Greek law.",
      },
      {
        heading: "2. Data we collect",
        body: "We collect account and contact details (name, email, phone), shipping addresses, order history, payment data processed by Viva.com (we do not store full card numbers on our servers), and technical data (cookies, IP address, device type) needed for security and site operation.",
      },
      {
        heading: "3. Why we process it",
        body: "We process data to fulfil orders and contracts, manage accounts, provide support, meet legal obligations (e.g. tax), prevent fraud, and—only with your consent—for optional analytics/marketing cookies.",
      },
      {
        heading: "4. Legal bases",
        body: "Contract performance, legitimate interests (security and service improvement), legal obligation, and consent where required (non-essential cookies, newsletter).",
      },
      {
        heading: "5. Sharing",
        body: "We share data with processors who help run the store (hosting, Viva.com payments, shipping, email). Where data leaves the EEA we use appropriate safeguards. We do not sell personal data.",
      },
      {
        heading: "6. Retention",
        body: "We keep order data as required by tax/commercial law and while your account remains active. Cookie and consent preferences follow our cookies policy.",
      },
      {
        heading: "7. Your rights",
        body: "You may request access, rectification, erasure, restriction, portability, objection, and withdrawal of consent. You may also lodge a complaint with the Hellenic DPA (www.dpa.gr) or your local authority.",
      },
      {
        heading: "8. Contact",
        body: "Privacy requests: privacy@soyoung.example.",
      },
    ],
  },
  terms: {
    title: "Terms of use",
    updated: "Last updated: September 2026",
    sections: [
      {
        heading: "1. General",
        body: "By using the SoYoung store you agree to these terms. If you do not agree, do not use the service.",
      },
      {
        heading: "2. Account",
        body: "You are responsible for accurate details and keeping your password confidential. We may suspend accounts in case of abuse.",
      },
      {
        heading: "3. Orders & pricing",
        body: "Prices are shown in EUR and may include or exclude VAT as indicated at checkout. An order is an offer to buy; acceptance is confirmed by email/order status. We may cancel for pricing errors or stock issues.",
      },
      {
        heading: "4. Payments",
        body: "Card payments are processed by Viva.com. Payment confirmation is required before shipping unless stated otherwise.",
      },
      {
        heading: "5. Intellectual property",
        body: "SoYoung content, marks and designs are protected. Reproduction without permission is prohibited.",
      },
      {
        heading: "6. Liability",
        body: "To the fullest extent permitted by law we are not liable for indirect damages from use of the site. Nothing limits mandatory consumer rights.",
      },
      {
        heading: "7. Governing law",
        body: "Greek law applies. Courts of Athens have jurisdiction, without prejudice to mandatory consumer venue rights.",
      },
    ],
  },
  cookies: {
    title: "Cookies policy",
    updated: "Last updated: September 2026",
    sections: [
      {
        heading: "1. What cookies are",
        body: "Cookies are small files stored on your device so the site can function and remember preferences.",
      },
      {
        heading: "2. Essential cookies",
        body: "Always used for sign-in, security, locale, cart and core operation. These do not require consent.",
      },
      {
        heading: "3. Optional cookies",
        body: "Analytics or marketing cookies run only if you choose Accept. Reject keeps essential cookies only.",
      },
      {
        heading: "4. Managing choices",
        body: "You can clear site data in your browser or contact us. See also our privacy policy.",
      },
    ],
  },
  shipping: {
    title: "Shipping",
    updated: "Last updated: September 2026",
    sections: [
      {
        heading: "1. Regions",
        body: "We ship within Greece and the EU unless otherwise stated at checkout.",
      },
      {
        heading: "2. Timing",
        body: "Typical delivery is 2–5 business days in Greece after payment confirmation. International timing may vary.",
      },
      {
        heading: "3. Cost",
        body: "Shipping is calculated at checkout. Orders above the free-shipping threshold shown in the store ship free within covered regions.",
      },
      {
        heading: "4. Delays",
        body: "Carrier or customs delays are outside our control; we share tracking when available.",
      },
    ],
  },
  returns: {
    title: "Returns",
    updated: "Last updated: September 2026",
    sections: [
      {
        heading: "1. Withdrawal",
        body: "For distance sales you may withdraw within 14 days of receipt under EU/Greek consumer law, subject to legal exceptions (e.g. sealed hygiene products once unsealed).",
      },
      {
        heading: "2. Condition",
        body: "Return items unused and in original packaging where possible, with proof of purchase.",
      },
      {
        heading: "3. Process",
        body: "Email returns@soyoung.example with your order number. After approval we send return instructions. Refunds go to the original payment method after inspection.",
      },
      {
        heading: "4. Defects",
        body: "For defective or incorrect items we cover return/replacement costs as required by law.",
      },
    ],
  },
};

export async function getLegalDoc(slug: LegalSlug): Promise<LegalDoc> {
  const locale = await getLocale();
  return (locale === "el" ? el : en)[slug];
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = await getLegalDoc(slug);
  return (
    <div className="container-page py-14 lg:py-20">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">{doc.title}</h1>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink-muted">
        {doc.updated}
      </p>
      <div className="mt-10 max-w-2xl space-y-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl text-ink">{section.heading}</h2>
            <p className="mt-3 text-sm leading-[1.75] text-ink-muted">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
