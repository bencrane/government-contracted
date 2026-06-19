import { type FormEvent, useState } from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { submitContact, type ContactState } from "@/lib/submit";
import { Button, Heading, Text } from "@/components/ui";
import { Field, TextArea, TextInput } from "./Field";

const initial: ContactState = { ok: false };

export default function ContactForm() {
  const [state, setState] = useState<ContactState>(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const result = await submitContact({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? ""),
      uei: String(form.get("uei") ?? ""),
      message: String(form.get("message") ?? ""),
    });
    setPending(false);
    setState(result);
  }

  if (state.ok) {
    return (
      <div className="border border-copper-200 bg-copper-50 p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-copper-600" />
        <Heading level={3} className="mt-5 text-navy-900">
          Sent.
        </Heading>
        <Text size="body-sm" className="mt-3">
          {state.message ?? "Got it. We'll be in touch."}
        </Text>
      </div>
    );
  }

  const err = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state.message && !state.ok && (
        <div className="border border-copper-300 bg-copper-50 px-4 py-3 text-sm text-copper-800">
          {state.message}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field name="name" label="Your Name" required error={err.name}>
          <TextInput
            name="name"
            placeholder="Full name"
            required
            invalid={!!err.name}
          />
        </Field>
        <Field name="email" label="Email" required error={err.email}>
          <TextInput
            name="email"
            type="email"
            placeholder="you@yourcompany.com"
            required
            invalid={!!err.email}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field name="company" label="Company" hint="Optional" error={err.company}>
          <TextInput
            name="company"
            placeholder="Your legal business name"
            invalid={!!err.company}
          />
        </Field>
        <Field name="uei" label="SAM.gov UEI" hint="Optional" error={err.uei}>
          <TextInput
            name="uei"
            placeholder="12 alphanumeric"
            invalid={!!err.uei}
          />
        </Field>
      </div>

      <Field name="message" label="Message" required error={err.message}>
        <TextArea
          name="message"
          rows={6}
          placeholder="What's on your mind?"
          invalid={!!err.message}
        />
      </Field>

      <div className="flex justify-end border-t border-line pt-5">
        <SubmitButton pending={pending} />
      </div>
    </form>
  );
}

function SubmitButton({ pending }: { pending: boolean }) {
  if (pending) {
    return (
      <Button type="submit" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Sending
      </Button>
    );
  }
  return (
    <Button type="submit" trailingIcon={ArrowRight}>
      Send message
    </Button>
  );
}
