--
-- PostgreSQL database dump
--

\restrict 6E8BitaamFhXiUx5hUgUM2z9CO7OxNAoA4OtV2kVrrNbEI6xRPZNQ0OQR9ZemTP

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.0

-- Started on 2025-12-31 17:02:35 CST

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
-- TOC entry 246 (class 1255 OID 16398)
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
-- TOC entry 3497 (class 0 OID 0)
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
-- TOC entry 3498 (class 0 OID 0)
-- Dependencies: 221
-- Name: origin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_id_seq OWNED BY public.origin.id;


--
-- TOC entry 228 (class 1259 OID 16684)
-- Name: origin_path; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.origin_path (
    id integer NOT NULL,
    origin_id integer NOT NULL,
    path text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.origin_path OWNER TO postgres_user;

--
-- TOC entry 227 (class 1259 OID 16683)
-- Name: origin_path_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.origin_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.origin_path_id_seq OWNER TO postgres_user;

--
-- TOC entry 3499 (class 0 OID 0)
-- Dependencies: 227
-- Name: origin_path_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_path_id_seq OWNED BY public.origin_path.id;


--
-- TOC entry 234 (class 1259 OID 16798)
-- Name: origin_path_segment; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.origin_path_segment (
    id integer NOT NULL,
    origin_path_id integer NOT NULL,
    origin_segment_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.origin_path_segment OWNER TO postgres_user;

--
-- TOC entry 233 (class 1259 OID 16797)
-- Name: origin_path_segment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.origin_path_segment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.origin_path_segment_id_seq OWNER TO postgres_user;

--
-- TOC entry 3500 (class 0 OID 0)
-- Dependencies: 233
-- Name: origin_path_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_path_segment_id_seq OWNED BY public.origin_path_segment.id;


--
-- TOC entry 226 (class 1259 OID 16663)
-- Name: origin_segment; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.origin_segment (
    id integer NOT NULL,
    origin_id integer NOT NULL,
    text text NOT NULL,
    text_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.origin_segment OWNER TO postgres_user;

--
-- TOC entry 225 (class 1259 OID 16662)
-- Name: origin_segment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.origin_segment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.origin_segment_id_seq OWNER TO postgres_user;

--
-- TOC entry 3501 (class 0 OID 0)
-- Dependencies: 225
-- Name: origin_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_segment_id_seq OWNED BY public.origin_segment.id;


--
-- TOC entry 232 (class 1259 OID 16732)
-- Name: translated_path; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.translated_path (
    id integer NOT NULL,
    origin_id integer NOT NULL,
    lang text NOT NULL,
    origin_path_id integer NOT NULL,
    translated_path text NOT NULL,
    hit_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.translated_path OWNER TO postgres_user;

--
-- TOC entry 231 (class 1259 OID 16731)
-- Name: translated_path_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.translated_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translated_path_id_seq OWNER TO postgres_user;

--
-- TOC entry 3502 (class 0 OID 0)
-- Dependencies: 231
-- Name: translated_path_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.translated_path_id_seq OWNED BY public.translated_path.id;


--
-- TOC entry 230 (class 1259 OID 16704)
-- Name: translated_segment; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public.translated_segment (
    id integer NOT NULL,
    origin_id integer NOT NULL,
    lang text NOT NULL,
    origin_segment_id integer NOT NULL,
    translated_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.translated_segment OWNER TO postgres_user;

--
-- TOC entry 229 (class 1259 OID 16703)
-- Name: translated_segment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.translated_segment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translated_segment_id_seq OWNER TO postgres_user;

--
-- TOC entry 3503 (class 0 OID 0)
-- Dependencies: 229
-- Name: translated_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.translated_segment_id_seq OWNED BY public.translated_segment.id;


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
-- TOC entry 3504 (class 0 OID 0)
-- Dependencies: 219
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 3271 (class 2604 OID 16442)
-- Name: host id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host ALTER COLUMN id SET DEFAULT nextval('public.host_id_seq'::regclass);


--
-- TOC entry 3268 (class 2604 OID 16419)
-- Name: origin id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin ALTER COLUMN id SET DEFAULT nextval('public.origin_id_seq'::regclass);


--
-- TOC entry 3279 (class 2604 OID 16687)
-- Name: origin_path id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path ALTER COLUMN id SET DEFAULT nextval('public.origin_path_id_seq'::regclass);


--
-- TOC entry 3287 (class 2604 OID 16801)
-- Name: origin_path_segment id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment ALTER COLUMN id SET DEFAULT nextval('public.origin_path_segment_id_seq'::regclass);


--
-- TOC entry 3277 (class 2604 OID 16666)
-- Name: origin_segment id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment ALTER COLUMN id SET DEFAULT nextval('public.origin_segment_id_seq'::regclass);


--
-- TOC entry 3284 (class 2604 OID 16735)
-- Name: translated_path id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path ALTER COLUMN id SET DEFAULT nextval('public.translated_path_id_seq'::regclass);


--
-- TOC entry 3281 (class 2604 OID 16707)
-- Name: translated_segment id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment ALTER COLUMN id SET DEFAULT nextval('public.translated_segment_id_seq'::regclass);


--
-- TOC entry 3265 (class 2604 OID 16403)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 3299 (class 2606 OID 16456)
-- Name: host host_hostname_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_hostname_key UNIQUE (hostname);


--
-- TOC entry 3301 (class 2606 OID 16454)
-- Name: host host_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_pkey PRIMARY KEY (id);


--
-- TOC entry 3295 (class 2606 OID 16430)
-- Name: origin origin_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_domain_key UNIQUE (domain);


--
-- TOC entry 3310 (class 2606 OID 16697)
-- Name: origin_path origin_path_origin_id_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path
    ADD CONSTRAINT origin_path_origin_id_path_key UNIQUE (origin_id, path);


--
-- TOC entry 3312 (class 2606 OID 16695)
-- Name: origin_path origin_path_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path
    ADD CONSTRAINT origin_path_pkey PRIMARY KEY (id);


--
-- TOC entry 3328 (class 2606 OID 16809)
-- Name: origin_path_segment origin_path_segment_origin_path_id_origin_segment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_origin_path_id_origin_segment_id_key UNIQUE (origin_path_id, origin_segment_id);


--
-- TOC entry 3330 (class 2606 OID 16807)
-- Name: origin_path_segment origin_path_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_pkey PRIMARY KEY (id);


--
-- TOC entry 3297 (class 2606 OID 16428)
-- Name: origin origin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_pkey PRIMARY KEY (id);


--
-- TOC entry 3305 (class 2606 OID 16677)
-- Name: origin_segment origin_segment_origin_id_text_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment
    ADD CONSTRAINT origin_segment_origin_id_text_hash_key UNIQUE (origin_id, text_hash);


--
-- TOC entry 3307 (class 2606 OID 16675)
-- Name: origin_segment origin_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment
    ADD CONSTRAINT origin_segment_pkey PRIMARY KEY (id);


--
-- TOC entry 3322 (class 2606 OID 16748)
-- Name: translated_path translated_path_origin_path_id_lang_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_origin_path_id_lang_key UNIQUE (origin_path_id, lang);


--
-- TOC entry 3324 (class 2606 OID 16746)
-- Name: translated_path translated_path_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_pkey PRIMARY KEY (id);


--
-- TOC entry 3316 (class 2606 OID 16720)
-- Name: translated_segment translated_segment_origin_segment_id_lang_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_origin_segment_id_lang_key UNIQUE (origin_segment_id, lang);


--
-- TOC entry 3318 (class 2606 OID 16718)
-- Name: translated_segment translated_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_pkey PRIMARY KEY (id);


--
-- TOC entry 3290 (class 2606 OID 16413)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 3292 (class 2606 OID 16411)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 3302 (class 1259 OID 16462)
-- Name: idx_host_origin_id; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_host_origin_id ON public.host USING btree (origin_id);


--
-- TOC entry 3308 (class 1259 OID 16760)
-- Name: idx_origin_path_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_path_lookup ON public.origin_path USING btree (origin_id, path);


--
-- TOC entry 3325 (class 1259 OID 16820)
-- Name: idx_origin_path_segment_path; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_path_segment_path ON public.origin_path_segment USING btree (origin_path_id);


--
-- TOC entry 3326 (class 1259 OID 16821)
-- Name: idx_origin_path_segment_segment; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_path_segment_segment ON public.origin_path_segment USING btree (origin_segment_id);


--
-- TOC entry 3303 (class 1259 OID 16759)
-- Name: idx_origin_segment_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_segment_lookup ON public.origin_segment USING btree (origin_id, text_hash);


--
-- TOC entry 3293 (class 1259 OID 16436)
-- Name: idx_origin_user_id; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_user_id ON public.origin USING btree (user_id);


--
-- TOC entry 3319 (class 1259 OID 16763)
-- Name: idx_translated_path_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_path_lookup ON public.translated_path USING btree (origin_path_id, lang);


--
-- TOC entry 3320 (class 1259 OID 16764)
-- Name: idx_translated_path_reverse; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_path_reverse ON public.translated_path USING btree (origin_id, lang, translated_path);


--
-- TOC entry 3313 (class 1259 OID 16761)
-- Name: idx_translated_segment_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_segment_lookup ON public.translated_segment USING btree (origin_segment_id, lang);


--
-- TOC entry 3314 (class 1259 OID 16762)
-- Name: idx_translated_segment_origin_lang; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_segment_origin_lang ON public.translated_segment USING btree (origin_id, lang);


--
-- TOC entry 3343 (class 2620 OID 16463)
-- Name: host host_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER host_updated_at BEFORE UPDATE ON public.host FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3342 (class 2620 OID 16437)
-- Name: origin origin_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER origin_updated_at BEFORE UPDATE ON public.origin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3344 (class 2620 OID 16765)
-- Name: translated_segment translated_segment_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER translated_segment_updated_at BEFORE UPDATE ON public.translated_segment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3341 (class 2620 OID 16414)
-- Name: user user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3332 (class 2606 OID 16457)
-- Name: host host_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3334 (class 2606 OID 16698)
-- Name: origin_path origin_path_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path
    ADD CONSTRAINT origin_path_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3339 (class 2606 OID 16810)
-- Name: origin_path_segment origin_path_segment_origin_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_origin_path_id_fkey FOREIGN KEY (origin_path_id) REFERENCES public.origin_path(id) ON DELETE CASCADE;


--
-- TOC entry 3340 (class 2606 OID 16815)
-- Name: origin_path_segment origin_path_segment_origin_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_origin_segment_id_fkey FOREIGN KEY (origin_segment_id) REFERENCES public.origin_segment(id) ON DELETE CASCADE;


--
-- TOC entry 3333 (class 2606 OID 16678)
-- Name: origin_segment origin_segment_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment
    ADD CONSTRAINT origin_segment_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3331 (class 2606 OID 16431)
-- Name: origin origin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- TOC entry 3337 (class 2606 OID 16749)
-- Name: translated_path translated_path_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3338 (class 2606 OID 16754)
-- Name: translated_path translated_path_origin_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_origin_path_id_fkey FOREIGN KEY (origin_path_id) REFERENCES public.origin_path(id) ON DELETE CASCADE;


--
-- TOC entry 3335 (class 2606 OID 16721)
-- Name: translated_segment translated_segment_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3336 (class 2606 OID 16726)
-- Name: translated_segment translated_segment_origin_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_origin_segment_id_fkey FOREIGN KEY (origin_segment_id) REFERENCES public.origin_segment(id) ON DELETE CASCADE;


--
-- TOC entry 2089 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO postgres_user;


--
-- TOC entry 2091 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO postgres_user;


--
-- TOC entry 2090 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO postgres_user;


--
-- TOC entry 2088 (class 826 OID 16390)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO postgres_user;


-- Completed on 2025-12-31 17:02:42 CST

--
-- PostgreSQL database dump complete
--

\unrestrict 6E8BitaamFhXiUx5hUgUM2z9CO7OxNAoA4OtV2kVrrNbEI6xRPZNQ0OQR9ZemTP

