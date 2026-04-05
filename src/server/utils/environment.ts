import * as v from "valibot";

const environmentSchema = v.object({
    KAFRAINBOX_DANGEROUSLY_NO_AUTH: v.optional(
        v.pipe(
            v.string(),
            v.transform((s) => s === "true" || s === "1"),
        ),
        "false",
    ),

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
