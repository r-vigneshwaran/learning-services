-- Database: dev

-- DROP DATABASE IF EXISTS dev;

CREATE DATABASE dev
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_India.1252'
    LC_CTYPE = 'English_India.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Table: public.BOOKING

-- DROP TABLE IF EXISTS public."BOOKING";

CREATE TABLE IF NOT EXISTS public."BOOKING"
(
    "ID" numeric NOT NULL,
    "TRIP_ID" numeric NOT NULL,
    "USER_ID" numeric NOT NULL,
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
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."BOOKING"
    OWNER to postgres;
	
	
-- Table: public.ORGANIZATION

-- DROP TABLE IF EXISTS public."ORGANIZATION";

CREATE TABLE IF NOT EXISTS public."ORGANIZATION"
(
    "ID" numeric NOT NULL,
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "CODE" text COLLATE pg_catalog."default" NOT NULL,
    "ADMIN_ID" numeric,
    CONSTRAINT "ORGANIZATION_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "USER_FK" FOREIGN KEY ("ADMIN_ID")
        REFERENCES public."USERS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ORGANIZATION"
    OWNER to postgres;
	
	
-- Table: public.ROLES

-- DROP TABLE IF EXISTS public."ROLES";

CREATE TABLE IF NOT EXISTS public."ROLES"
(
    "ID" numeric NOT NULL,
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "CODE" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "ROLES_pkey" PRIMARY KEY ("ID")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ROLES"
    OWNER to postgres;
	
-- Table: public.TRIPS

-- DROP TABLE IF EXISTS public."TRIPS";

CREATE TABLE IF NOT EXISTS public."TRIPS"
(
    "ID" numeric NOT NULL,
    "FROM" text COLLATE pg_catalog."default" NOT NULL,
    "TO" text COLLATE pg_catalog."default" NOT NULL,
    "DATE_TIME" timestamp without time zone,
    "CAPACITY" text COLLATE pg_catalog."default",
    "CREATED_BY" numeric NOT NULL,
    "IS_ACCEPTED" text COLLATE pg_catalog."default",
    "ORG_ID" numeric NOT NULL,
    CONSTRAINT "TRIPS_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "ORG_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "USER_FK" FOREIGN KEY ("CREATED_BY")
        REFERENCES public."USERS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."TRIPS"
    OWNER to postgres;
	
	
-- Table: public.USERS

-- DROP TABLE IF EXISTS public."USERS";

CREATE TABLE IF NOT EXISTS public."USERS"
(
    "ID" numeric NOT NULL,
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "EMAIL" text COLLATE pg_catalog."default",
    "MOBILE" text COLLATE pg_catalog."default" NOT NULL,
    "ADDRESS" text COLLATE pg_catalog."default",
    "ORG_ID" numeric NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    CONSTRAINT "USERS_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "GROUP_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."USERS"
    OWNER to postgres;
	
	
-- Table: public.USER_ROLES

-- DROP TABLE IF EXISTS public."USER_ROLES";

CREATE TABLE IF NOT EXISTS public."USER_ROLES"
(
    "UR_ID" numeric NOT NULL,
    "USER_ID" numeric NOT NULL,
    "ROLE_ID" numeric NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    CONSTRAINT "USER_ROLES_pkey" PRIMARY KEY ("UR_ID"),
    CONSTRAINT "ROLE_FK" FOREIGN KEY ("ROLE_ID")
        REFERENCES public."ROLES" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "USER_FK" FOREIGN KEY ("USER_ID")
        REFERENCES public."USERS" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."USER_ROLES"
    OWNER to postgres;
	
	
-- Table: public.VEHICLE

-- DROP TABLE IF EXISTS public."VEHICLE";

CREATE TABLE IF NOT EXISTS public."VEHICLE"
(
    "REG_NO" text COLLATE pg_catalog."default" NOT NULL,
    "CAPACITY" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "ORG_ID" numeric NOT NULL,
    "CAPACITY_UNIT" text COLLATE pg_catalog."default" NOT NULL,
    "ID" numeric NOT NULL,
    "TYPE" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "VEHICLE_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "ORG_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."VEHICLE"
    OWNER to postgres;