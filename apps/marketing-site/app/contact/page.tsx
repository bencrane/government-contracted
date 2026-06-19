import ContactForm from "@/components/forms/ContactForm";

export const metadata = {
  title: "Contact — Government Contracted",
  description: "Get in touch.",
};

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 paper-grid opacity-30" />

      <div className="relative mx-auto max-w-3xl px-6 pt-16 pb-24 md:pt-20">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
          Contact
        </p>
        <h1 className="font-display mt-3 text-5xl leading-[1.05] text-navy-900 text-balance md:text-6xl">
          Get in touch.
        </h1>
        <p className="mt-5 text-slate-700">
          Two business days to respond.
        </p>

        <div className="mt-10 border border-line-strong bg-surface p-7 shadow-[0_24px_60px_-30px_rgba(15,26,46,0.18)] md:p-10">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
