


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
    CONSTRAINT "USERS_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "GROUP_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."USERS"
    OWNER to postgres;


-- Table: public.ROLES

-- DROP TABLE IF EXISTS public."ROLES";

CREATE TABLE IF NOT EXISTS public."ROLES"
(
    "ID" integer NOT NULL DEFAULT nextval('"ROLES_ID_seq"'::regclass),
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "CODE" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "ROLES_pkey" PRIMARY KEY ("ID")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ROLES"
    OWNER to postgres;


-- Table: public.USER_ROLES

-- DROP TABLE IF EXISTS public."USER_ROLES";

CREATE TABLE IF NOT EXISTS public."USER_ROLES"
(
    "UR_ID" integer NOT NULL DEFAULT nextval('"USER_ROLES_UR_ID_seq"'::regclass),
    "USER_ID" integer NOT NULL,
    "ROLE_ID" integer NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    CONSTRAINT "USER_ROLES_pkey" PRIMARY KEY ("UR_ID"),
    CONSTRAINT "ROLE_FK" FOREIGN KEY ("ROLE_ID")
        REFERENCES public."ROLES" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "USER_FK" FOREIGN KEY ("USER_ID")
        REFERENCES public."USERS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."USER_ROLES"
    OWNER to postgres;


-- Table: public.VEHICLE

-- DROP TABLE IF EXISTS public."VEHICLE";

CREATE TABLE IF NOT EXISTS public."VEHICLE"
(
    "REG_NO" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "ORG_ID" integer NOT NULL,
    "CAPACITY_UNIT" text COLLATE pg_catalog."default" NOT NULL,
    "ID" integer NOT NULL DEFAULT nextval('"VEHICLE_ID_seq"'::regclass),
    "TYPE" text COLLATE pg_catalog."default" NOT NULL,
    "VEHICLE_NAME" text COLLATE pg_catalog."default" NOT NULL,
    "CATEGORY_CODE" text COLLATE pg_catalog."default",
    "MODEL_YEAR" text COLLATE pg_catalog."default",
    "RC_VALIDITY" text COLLATE pg_catalog."default",
    "OWNERSHIP" text COLLATE pg_catalog."default",
    "OWNER_NAME" text COLLATE pg_catalog."default",
    "CITY" text COLLATE pg_catalog."default",
    CONSTRAINT "VEHICLE_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "ORG_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."VEHICLE"
    OWNER to postgres;


-- Table: public.TRIPS

-- DROP TABLE IF EXISTS public."TRIPS";

CREATE TABLE IF NOT EXISTS public."TRIPS"
(
    "ID" integer NOT NULL DEFAULT nextval('"TRIPS_ID_seq"'::regclass),
    "FROM" text COLLATE pg_catalog."default" NOT NULL,
    "TO" text COLLATE pg_catalog."default" NOT NULL,
    "DATE_TIME" timestamp without time zone,
    "CAPACITY" text COLLATE pg_catalog."default",
    "DRIVER_ID" integer NOT NULL,
    "IS_ACCEPTED" text COLLATE pg_catalog."default",
    "ORG_ID" integer NOT NULL,
    "VEHICLE_ID" integer NOT NULL,
    CONSTRAINT "TRIPS_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "ORG_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "USER_FK" FOREIGN KEY ("DRIVER_ID")
        REFERENCES public."USERS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "VEHICLE_FK" FOREIGN KEY ("VEHICLE_ID")
        REFERENCES public."VEHICLE" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."TRIPS"
    OWNER to postgres;


-- Table: public.BOOKING

-- DROP TABLE IF EXISTS public."BOOKING";

CREATE TABLE IF NOT EXISTS public."BOOKING"
(
    "ID" integer NOT NULL DEFAULT nextval('"BOOKING_ID_seq"'::regclass),
    "TRIP_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "QUOTE" text COLLATE pg_catalog."default",
    "STATUS" text COLLATE pg_catalog."default",
    CONSTRAINT "BOOKING_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "TRIP_FK" FOREIGN KEY ("TRIP_ID")
        REFERENCES public."TRIPS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "USER_FK" FOREIGN KEY ("USER_ID")
        REFERENCES public."USERS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."BOOKING"
    OWNER to postgres;


-- Table: public.VEHICLE_IMAGES

-- DROP TABLE IF EXISTS public."VEHICLE_IMAGES";

CREATE TABLE IF NOT EXISTS public."VEHICLE_IMAGES"
(
    "ID" integer NOT NULL DEFAULT nextval('"VEHICLE_IMAGES_ID_seq"'::regclass),
    "VEHICLE_ID" integer NOT NULL,
    "IMAGE" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "VEH_IMG_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "VEH_IMG_FK" FOREIGN KEY ("VEHICLE_ID")
        REFERENCES public."VEHICLE" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."VEHICLE_IMAGES"
    OWNER to postgres;

-- Table: public.USER_IMAGES

-- DROP TABLE IF EXISTS public."USER_IMAGES";

CREATE TABLE IF NOT EXISTS public."USER_IMAGES"
(
    "ID" SERIAL,
    "USER_ID" integer NOT NULL,
    "IMAGE" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "USR_IMG_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "USR_IMG_FK" FOREIGN KEY ("USER_ID")
        REFERENCES public."USER" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."USER_IMAGES"
    OWNER to postgres;
    
-- Table: public.MESSAGES

-- DROP TABLE IF EXISTS public."MESSAGES";

CREATE TABLE IF NOT EXISTS public."MESSAGES"
(
    "ID" integer NOT NULL DEFAULT nextval('"MESSAGES_ID_seq"'::regclass),
    "USER_ID" text COLLATE pg_catalog."default" NOT NULL,
    "IS_SINGLE_USER" boolean,
    "IS_READ" boolean,
    "IS_BROADCAST" boolean,
    "IS_CATEGORY" boolean,
    "IS_GROUP" boolean,
    "MESSAGE" text COLLATE pg_catalog."default" NOT NULL,
    "CREATED_AT" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "MSG_pkey" PRIMARY KEY ("ID")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."MESSAGES"
    OWNER to postgres;