import * as v from "valibot";

const environmentSchema = v.object({
    KAFRAINBOX_HTTP_PORT: v.optional(
        v.pipe(
            v.string(),
            v.transform((s) => parseInt(s, 10)),
        ),
        "3134",
    ),

    KAFRAINBOX_SMTP_PORT: v.optional(
        v.pipe(
            v.string(),
            v.transform((s) => parseInt(s, 10)),
        ),
        "1025",
    ),
});

export const environment = v.parse(environmentSchema, Bun.env);
