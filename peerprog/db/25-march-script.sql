-- Database: dev

-- DROP DATABASE IF EXISTS dev;

-- Table: public.BOOKING

--DROP EXTENSION "uuid-ossp";
--CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: public.ORGANIZATION

-- DROP TABLE IF EXISTS public."ORGANIZATION";

CREATE TABLE IF NOT EXISTS public."ORGANIZATION"
(
    "ID" uuid DEFAULT uuid_generate_v4(),
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "CODE" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "ORGANIZATION_pkey" PRIMARY KEY ("ID")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ORGANIZATION"
    OWNER to postgres;
	

-- Table: public.USERS

-- DROP TABLE IF EXISTS public."USERS";

CREATE TABLE IF NOT EXISTS public."USERS"
(
    "ID" uuid DEFAULT uuid_generate_v4(),
    "NAME" text COLLATE pg_catalog."default" NOT NULL,
    "EMAIL" text COLLATE pg_catalog."default",
    "MOBILE" text COLLATE pg_catalog."default" NOT NULL,
    "ADDRESS" text COLLATE pg_catalog."default",
    "ORG_ID" uuid NOT NULL,
    "IS_ACTIVE" text COLLATE pg_catalog."default",
    "REFRESH_TOKEN" text COLLATE pg_catalog."default",
    "ROLE" text COLLATE pg_catalog."default",
    "PASSWORD" text COLLATE pg_catalog."default" NOT NULL,
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
	
	
	
-- Table: public.ROLES

-- DROP TABLE IF EXISTS public."ROLES";

CREATE TABLE IF NOT EXISTS public."ROLES" 
(
    "ID" uuid DEFAULT uuid_generate_v4(),
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
	

-- Table: public.USER_ROLES

-- DROP TABLE IF EXISTS public."USER_ROLES";

CREATE TABLE IF NOT EXISTS public."USER_ROLES"
(
    "UR_ID" uuid DEFAULT uuid_generate_v4(),
    "USER_ID" uuid NOT NULL,
    "ROLE_ID" uuid NOT NULL,
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
    "ORG_ID" uuid NOT NULL,
    "CAPACITY_UNIT" text COLLATE pg_catalog."default" NOT NULL,
    "ID" uuid DEFAULT uuid_generate_v4(),
    "TYPE" text COLLATE pg_catalog."default" NOT NULL,
    "IMAGE" text COLLATE pg_catalog."default",
    "VEHICLE_NAME" text COLLATE pg_catalog."default",
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
	

	
-- Table: public.TRIPS

-- DROP TABLE IF EXISTS public."TRIPS";

CREATE TABLE IF NOT EXISTS public."TRIPS"
(
    "ID" uuid DEFAULT uuid_generate_v4(),
    "FROM" text COLLATE pg_catalog."default" NOT NULL,
    "TO" text COLLATE pg_catalog."default" NOT NULL,
    "DATE_TIME" timestamp without time zone,
    "CAPACITY" text COLLATE pg_catalog."default",
    "CREATED_BY" uuid NOT NULL,
    "IS_ACCEPTED" text COLLATE pg_catalog."default",
    "ORG_ID" uuid NOT NULL,
    "VEHICLE_ID" uuid NOT NULL,
    CONSTRAINT "TRIPS_pkey" PRIMARY KEY ("ID"),
    CONSTRAINT "ORG_FK" FOREIGN KEY ("ORG_ID")
        REFERENCES public."ORGANIZATION" ("ID") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "VEHICLE_FK" FOREIGN KEY ("VEHICLE_ID")
        REFERENCES public."VEHICLE" ("ID") MATCH SIMPLE
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
	



-- DROP TABLE IF EXISTS public."BOOKING";

CREATE TABLE IF NOT EXISTS public."BOOKING"
(
    "ID" uuid DEFAULT uuid_generate_v4(),
    "TRIP_ID" uuid NOT NULL,
    "USER_ID" uuid NOT NULL,
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
	
	


	

	
	

	
