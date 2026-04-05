import * as v from "valibot";

const environmentSchema = v.object({
    KAFRAINBOX_DANGEROUSLY_NO_AUTH: v.optional(v.string(), "false"),

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

const _env = v.parse(environmentSchema, Bun.env);

export const environment = {
    ..._env,
    KAFRAINBOX_DANGEROUSLY_NO_AUTH:
        _env.KAFRAINBOX_DANGEROUSLY_NO_AUTH === "true" ||
        _env.KAFRAINBOX_DANGEROUSLY_NO_AUTH === "1",
};

console.log(environment);
