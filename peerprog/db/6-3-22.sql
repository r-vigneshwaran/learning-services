-- Table: public.ORGANIZATION

-- DROP TABLE IF EXISTS public."ORGANIZATION";

CREATE TABLE IF NOT EXISTS public."ORGANIZATION"
(
    "ID" integer NOT NULL DEFAULT nextval('"ORGANIZATION_ID_seq"'::regclass),
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "CODE" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" boolean,
    CONSTRAINT "ORGANIZATION_pkey" PRIMARY KEY ("ID")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ORGANIZATION"
    OWNER to postgres;


-- Table: public.USERS

-- DROP TABLE IF EXISTS public."USERS";

CREATE TABLE IF NOT EXISTS public."USERS"
(
    "ID" integer NOT NULL DEFAULT nextval('"USERS_ID_seq"'::regclass),
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "EMAIL" text COLLATE pg_catalog."default",
    "MOBILE" text COLLATE pg_catalog."default",
    "ADDRESS" text COLLATE pg_catalog."default",
    "ORG_ID" integer NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "REFRESH_TOKEN" text COLLATE pg_catalog."default",
    "ROLE" text COLLATE pg_catalog."default",
    "PASSWORD" text COLLATE pg_catalog."default" NOT NULL,
    "IS_REGISTERED" boolean DEFAULT false,
    "ROLE_CODE" integer,
    "E_SIGN" text COLLATE pg_catalog."default",
    "VERIFIED" boolean DEFAULT false,
    "OTP" text COLLATE pg_catalog."default",
    "CREATED_AT" text COLLATE pg_catalog."default",
    "EXPIRES_AT" text COLLATE pg_catalog."default",
    "CURRENT_STEP" integer DEFAULT 1,
    "IS_ORG_HEAD" boolean DEFAULT true,
    "DRIVER_LICENCE_NO" text COLLATE pg_catalog."default",
    "YEAR_OF_EXPERIENCE" integer,
    "DRIVER_LICENCE_VALIDITY" text COLLATE pg_catalog."default",
    "AADHAR_NUMBER" text COLLATE pg_catalog."default",
    "OWNERSHIP" text COLLATE pg_catalog."default",
    "CITY" text COLLATE pg_catalog."default",
    "PERSONAL_EMAIL" text COLLATE pg_catalog."default",
    "DELETED" boolean DEFAULT false,
    "REVOKED" boolean DEFAULT false,
    "REVOKE_EXPIRES_AT" text COLLATE pg_catalog."default",
    "OTHERS_VERIFIED" boolean DEFAULT false,
    "FP_VERIFIED" boolean DEFAULT false,
    "FP_EXPIRES_AT" text COLLATE pg_catalog."default",
    "FP_CURRENT_STEP" text COLLATE pg_catalog."default" DEFAULT 1,
    CONSTRAINT "USERS_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "GROUP_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."USERS"
    OWNER to postgres;    