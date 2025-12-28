--
-- PostgreSQL database dump
--

\restrict z5JbcuiwlOHalBIpGUelwCd36XtRteIr55z6XgMXiMceMgX1m3NXxRf3NFUNJRC

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.0

-- Started on 2025-12-27 16:42:09 CST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres_user;

--
-- TOC entry 231 (class 1255 OID 16398)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16439)
-- Name: host; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.host (
    id integer NOT NULL,
    origin_id integer,
    hostname text NOT NULL,
    target_lang text NOT NULL,
    skip_words text[],
    skip_patterns text[],
    skip_path text[],
    translate_path boolean DEFAULT true,
    proxied_cache integer DEFAULT 0,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.host OWNER TO postgres_user;

--
-- TOC entry 223 (class 1259 OID 16438)
-- Name: host_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.host_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.host_id_seq OWNER TO postgres_user;

--
-- TOC entry 3467 (class 0 OID 0)
-- Dependencies: 223
-- Name: host_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.host_id_seq OWNED BY public.host.id;


--
-- TOC entry 222 (class 1259 OID 16416)
-- Name: origin; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.origin (
    id integer NOT NULL,
    user_id integer,
    domain text NOT NULL,
    origin_lang text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.origin OWNER TO postgres_user;

--
-- TOC entry 221 (class 1259 OID 16415)
-- Name: origin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.origin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.origin_id_seq OWNER TO postgres_user;

--
-- TOC entry 3468 (class 0 OID 0)
-- Dependencies: 221
-- Name: origin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_id_seq OWNED BY public.origin.id;


--
-- TOC entry 226 (class 1259 OID 16465)
-- Name: pathname; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.pathname (
    id integer NOT NULL,
    host_id integer,
    path text NOT NULL,
    translated_path text NOT NULL,
    hit_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pathname OWNER TO postgres_user;

--
-- TOC entry 225 (class 1259 OID 16464)
-- Name: pathname_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.pathname_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pathname_id_seq OWNER TO postgres_user;

--
-- TOC entry 3469 (class 0 OID 0)
-- Dependencies: 225
-- Name: pathname_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.pathname_id_seq OWNED BY public.pathname.id;


--
-- TOC entry 230 (class 1259 OID 16511)
-- Name: pathname_translation; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.pathname_translation (
    id integer NOT NULL,
    pathname_id integer,
    translation_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pathname_translation OWNER TO postgres_user;

--
-- TOC entry 229 (class 1259 OID 16510)
-- Name: pathname_translation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.pathname_translation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pathname_translation_id_seq OWNER TO postgres_user;

--
-- TOC entry 3470 (class 0 OID 0)
-- Dependencies: 229
-- Name: pathname_translation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.pathname_translation_id_seq OWNED BY public.pathname_translation.id;


--
-- TOC entry 228 (class 1259 OID 16487)
-- Name: translation; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.translation (
    id integer NOT NULL,
    host_id integer,
    original_text text NOT NULL,
    translated_text text NOT NULL,
    kind text,
    text_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.translation OWNER TO postgres_user;

--
-- TOC entry 227 (class 1259 OID 16486)
-- Name: translation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.translation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translation_id_seq OWNER TO postgres_user;

--
-- TOC entry 3471 (class 0 OID 0)
-- Dependencies: 227
-- Name: translation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.translation_id_seq OWNED BY public.translation.id;


--
-- TOC entry 220 (class 1259 OID 16400)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."user" OWNER TO postgres_user;

--
-- TOC entry 219 (class 1259 OID 16399)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres_user;

--
-- TOC entry 3472 (class 0 OID 0)
-- Dependencies: 219
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 3261 (class 2604 OID 16442)
-- Name: host id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host ALTER COLUMN id SET DEFAULT nextval('public.host_id_seq'::regclass);


--
-- TOC entry 3258 (class 2604 OID 16419)
-- Name: origin id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin ALTER COLUMN id SET DEFAULT nextval('public.origin_id_seq'::regclass);


--
-- TOC entry 3267 (class 2604 OID 16468)
-- Name: pathname id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname ALTER COLUMN id SET DEFAULT nextval('public.pathname_id_seq'::regclass);


--
-- TOC entry 3273 (class 2604 OID 16514)
-- Name: pathname_translation id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname_translation ALTER COLUMN id SET DEFAULT nextval('public.pathname_translation_id_seq'::regclass);


--
-- TOC entry 3270 (class 2604 OID 16490)
-- Name: translation id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translation ALTER COLUMN id SET DEFAULT nextval('public.translation_id_seq'::regclass);


--
-- TOC entry 3255 (class 2604 OID 16403)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 3285 (class 2606 OID 16456)
-- Name: host host_hostname_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_hostname_key UNIQUE (hostname);


--
-- TOC entry 3287 (class 2606 OID 16454)
-- Name: host host_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_pkey PRIMARY KEY (id);


--
-- TOC entry 3281 (class 2606 OID 16430)
-- Name: origin origin_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_domain_key UNIQUE (domain);


--
-- TOC entry 3283 (class 2606 OID 16428)
-- Name: origin origin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_pkey PRIMARY KEY (id);


--
-- TOC entry 3291 (class 2606 OID 16479)
-- Name: pathname pathname_host_id_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname
    ADD CONSTRAINT pathname_host_id_path_key UNIQUE (host_id, path);


--
-- TOC entry 3293 (class 2606 OID 16477)
-- Name: pathname pathname_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname
    ADD CONSTRAINT pathname_pkey PRIMARY KEY (id);


--
-- TOC entry 3302 (class 2606 OID 16520)
-- Name: pathname_translation pathname_translation_pathname_id_translation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname_translation
    ADD CONSTRAINT pathname_translation_pathname_id_translation_id_key UNIQUE (pathname_id, translation_id);


--
-- TOC entry 3304 (class 2606 OID 16518)
-- Name: pathname_translation pathname_translation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname_translation
    ADD CONSTRAINT pathname_translation_pkey PRIMARY KEY (id);


--
-- TOC entry 3296 (class 2606 OID 16502)
-- Name: translation translation_host_id_text_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translation
    ADD CONSTRAINT translation_host_id_text_hash_key UNIQUE (host_id, text_hash);


--
-- TOC entry 3298 (class 2606 OID 16500)
-- Name: translation translation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translation
    ADD CONSTRAINT translation_pkey PRIMARY KEY (id);


--
-- TOC entry 3276 (class 2606 OID 16413)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 3278 (class 2606 OID 16411)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 3288 (class 1259 OID 16462)
-- Name: idx_host_origin_id; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_host_origin_id ON public.host USING btree (origin_id);


--
-- TOC entry 3279 (class 1259 OID 16436)
-- Name: idx_origin_user_id; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_user_id ON public.origin USING btree (user_id);


--
-- TOC entry 3289 (class 1259 OID 16485)
-- Name: idx_pathname_host_translated; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_host_translated ON public.pathname USING btree (host_id, translated_path);


--
-- TOC entry 3299 (class 1259 OID 16531)
-- Name: idx_pathname_translation_pathname; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_translation_pathname ON public.pathname_translation USING btree (pathname_id);


--
-- TOC entry 3300 (class 1259 OID 16532)
-- Name: idx_pathname_translation_reverse; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_translation_reverse ON public.pathname_translation USING btree (translation_id);


--
-- TOC entry 3294 (class 1259 OID 16508)
-- Name: idx_translation_search; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translation_search ON public.translation USING btree (host_id, original_text);


--
-- TOC entry 3313 (class 2620 OID 16463)
-- Name: host host_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER host_updated_at BEFORE UPDATE ON public.host FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3312 (class 2620 OID 16437)
-- Name: origin origin_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER origin_updated_at BEFORE UPDATE ON public.origin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3314 (class 2620 OID 16509)
-- Name: translation translation_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER translation_updated_at BEFORE UPDATE ON public.translation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3311 (class 2620 OID 16414)
-- Name: user user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3306 (class 2606 OID 16457)
-- Name: host host_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3305 (class 2606 OID 16431)
-- Name: origin origin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- TOC entry 3307 (class 2606 OID 16480)
-- Name: pathname pathname_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname
    ADD CONSTRAINT pathname_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.host(id) ON DELETE CASCADE;


--
-- TOC entry 3309 (class 2606 OID 16521)
-- Name: pathname_translation pathname_translation_pathname_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname_translation
    ADD CONSTRAINT pathname_translation_pathname_id_fkey FOREIGN KEY (pathname_id) REFERENCES public.pathname(id) ON DELETE CASCADE;


--
-- TOC entry 3310 (class 2606 OID 16526)
-- Name: pathname_translation pathname_translation_translation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.pathname_translation
    ADD CONSTRAINT pathname_translation_translation_id_fkey FOREIGN KEY (translation_id) REFERENCES public.translation(id) ON DELETE CASCADE;


--
-- TOC entry 3308 (class 2606 OID 16503)
-- Name: translation translation_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translation
    ADD CONSTRAINT translation_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.host(id) ON DELETE CASCADE;


--
-- TOC entry 2079 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO postgres_user;


--
-- TOC entry 2081 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO postgres_user;


--
-- TOC entry 2080 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO postgres_user;


--
-- TOC entry 2078 (class 826 OID 16390)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO postgres_user;


-- Completed on 2025-12-27 16:42:16 CST

--
-- PostgreSQL database dump complete
--

\unrestrict z5JbcuiwlOHalBIpGUelwCd36XtRteIr55z6XgMXiMceMgX1m3NXxRf3NFUNJRC

