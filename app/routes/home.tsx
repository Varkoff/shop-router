import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  type ActionFunctionArgs,
  data,
  Form,
  useActionData,
} from "react-router";
import { z } from "zod";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";

const LoginSchema = z.object({
  email: z.string().email({
    message: "Email invalide",
  }),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: LoginSchema.superRefine((data, ctx) => {
      if (data.email !== "virgile@algomax.fr") {
        ctx.addIssue({
          message:
            "L'email n'est pas correct: vous ne faites pas partie d'Algomax",
          path: ["email"],
          code: "custom",
        });
      }
    }),
  });

  if (submission.status !== "success") {
    return data(
      {
        result: submission.reply(),
      },
      {
        status: 400,
      },
    );
  }
  return data({
    result: submission.reply(),
  });
}

export default function Home() {
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(LoginSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: LoginSchema,
      });
    },
    lastResult: actionData?.result,
  });
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="text-4xl font-bold text-sky-600">
            Bienvenue sur Shop Router
          </h1>
        </header>
        <Form
          {...getFormProps(form)}
          className="max-w-[300px] w-full space-y-6 px-4"
          method="POST"
        >
          <Field
            inputProps={{
              ...getInputProps(fields.email, {
                type: "email",
              }),
            }}
            labelProps={{ children: "Email" }}
            errors={fields.email.errors}
          />
          <Button variant="default" type="submit">
            Bienvenue sur Shop Router
          </Button>
        </Form>
      </div>
    </main>
  );
}
