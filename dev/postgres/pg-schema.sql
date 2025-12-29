--
-- PostgreSQL database dump
--

\restrict yzyQa4n3vzpUOxAxJuPCWoMkQaUgVBHytfvcVmtbz2D3LUwzDDIk8BsbiNDu6H3

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.0

-- Started on 2025-12-29 08:36:47 CST

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
-- TOC entry 254 (class 1255 OID 16398)
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
-- TOC entry 226 (class 1259 OID 16465)
-- Name: _old_pathname; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public._old_pathname (
    id integer CONSTRAINT pathname_id_not_null NOT NULL,
    host_id integer,
    path text CONSTRAINT pathname_path_not_null NOT NULL,
    translated_path text CONSTRAINT pathname_translated_path_not_null NOT NULL,
    hit_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public._old_pathname OWNER TO postgres_user;

--
-- TOC entry 240 (class 1259 OID 16767)
-- Name: _old_pathname_translation; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public._old_pathname_translation (
    id integer CONSTRAINT pathname_translation_id_not_null1 NOT NULL,
    translated_path_id integer,
    translated_segment_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public._old_pathname_translation OWNER TO postgres_user;

--
-- TOC entry 230 (class 1259 OID 16511)
-- Name: _old_pathname_translation_v1; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public._old_pathname_translation_v1 (
    id integer CONSTRAINT pathname_translation_id_not_null NOT NULL,
    pathname_id integer,
    translation_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public._old_pathname_translation_v1 OWNER TO postgres_user;

--
-- TOC entry 228 (class 1259 OID 16487)
-- Name: _old_translation; Type: TABLE; Schema: public; Owner: postgres_user
--

CREATE TABLE public._old_translation (
    id integer CONSTRAINT translation_id_not_null NOT NULL,
    host_id integer,
    original_text text CONSTRAINT translation_original_text_not_null NOT NULL,
    translated_text text CONSTRAINT translation_translated_text_not_null NOT NULL,
    kind text,
    text_hash text CONSTRAINT translation_text_hash_not_null NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public._old_translation OWNER TO postgres_user;

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
-- TOC entry 3556 (class 0 OID 0)
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
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 221
-- Name: origin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_id_seq OWNED BY public.origin.id;


--
-- TOC entry 234 (class 1259 OID 16684)
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
-- TOC entry 233 (class 1259 OID 16683)
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
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 233
-- Name: origin_path_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_path_id_seq OWNED BY public.origin_path.id;


--
-- TOC entry 242 (class 1259 OID 16798)
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
-- TOC entry 241 (class 1259 OID 16797)
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
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 241
-- Name: origin_path_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_path_segment_id_seq OWNED BY public.origin_path_segment.id;


--
-- TOC entry 232 (class 1259 OID 16663)
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
-- TOC entry 231 (class 1259 OID 16662)
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
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 231
-- Name: origin_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.origin_segment_id_seq OWNED BY public.origin_segment.id;


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
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 225
-- Name: pathname_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.pathname_id_seq OWNED BY public._old_pathname.id;


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
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 229
-- Name: pathname_translation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.pathname_translation_id_seq OWNED BY public._old_pathname_translation_v1.id;


--
-- TOC entry 239 (class 1259 OID 16766)
-- Name: pathname_translation_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres_user
--

CREATE SEQUENCE public.pathname_translation_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pathname_translation_id_seq1 OWNER TO postgres_user;

--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 239
-- Name: pathname_translation_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.pathname_translation_id_seq1 OWNED BY public._old_pathname_translation.id;


--
-- TOC entry 238 (class 1259 OID 16732)
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
-- TOC entry 237 (class 1259 OID 16731)
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
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 237
-- Name: translated_path_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.translated_path_id_seq OWNED BY public.translated_path.id;


--
-- TOC entry 236 (class 1259 OID 16704)
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
-- TOC entry 235 (class 1259 OID 16703)
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
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 235
-- Name: translated_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.translated_segment_id_seq OWNED BY public.translated_segment.id;


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
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 227
-- Name: translation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.translation_id_seq OWNED BY public._old_translation.id;


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
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 219
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres_user
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 3297 (class 2604 OID 16468)
-- Name: _old_pathname id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname ALTER COLUMN id SET DEFAULT nextval('public.pathname_id_seq'::regclass);


--
-- TOC entry 3315 (class 2604 OID 16770)
-- Name: _old_pathname_translation id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation ALTER COLUMN id SET DEFAULT nextval('public.pathname_translation_id_seq1'::regclass);


--
-- TOC entry 3303 (class 2604 OID 16514)
-- Name: _old_pathname_translation_v1 id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation_v1 ALTER COLUMN id SET DEFAULT nextval('public.pathname_translation_id_seq'::regclass);


--
-- TOC entry 3300 (class 2604 OID 16490)
-- Name: _old_translation id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_translation ALTER COLUMN id SET DEFAULT nextval('public.translation_id_seq'::regclass);


--
-- TOC entry 3291 (class 2604 OID 16442)
-- Name: host id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host ALTER COLUMN id SET DEFAULT nextval('public.host_id_seq'::regclass);


--
-- TOC entry 3288 (class 2604 OID 16419)
-- Name: origin id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin ALTER COLUMN id SET DEFAULT nextval('public.origin_id_seq'::regclass);


--
-- TOC entry 3307 (class 2604 OID 16687)
-- Name: origin_path id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path ALTER COLUMN id SET DEFAULT nextval('public.origin_path_id_seq'::regclass);


--
-- TOC entry 3317 (class 2604 OID 16801)
-- Name: origin_path_segment id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment ALTER COLUMN id SET DEFAULT nextval('public.origin_path_segment_id_seq'::regclass);


--
-- TOC entry 3305 (class 2604 OID 16666)
-- Name: origin_segment id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment ALTER COLUMN id SET DEFAULT nextval('public.origin_segment_id_seq'::regclass);


--
-- TOC entry 3312 (class 2604 OID 16735)
-- Name: translated_path id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path ALTER COLUMN id SET DEFAULT nextval('public.translated_path_id_seq'::regclass);


--
-- TOC entry 3309 (class 2604 OID 16707)
-- Name: translated_segment id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment ALTER COLUMN id SET DEFAULT nextval('public.translated_segment_id_seq'::regclass);


--
-- TOC entry 3285 (class 2604 OID 16403)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 3329 (class 2606 OID 16456)
-- Name: host host_hostname_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_hostname_key UNIQUE (hostname);


--
-- TOC entry 3331 (class 2606 OID 16454)
-- Name: host host_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_pkey PRIMARY KEY (id);


--
-- TOC entry 3325 (class 2606 OID 16430)
-- Name: origin origin_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_domain_key UNIQUE (domain);


--
-- TOC entry 3356 (class 2606 OID 16697)
-- Name: origin_path origin_path_origin_id_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path
    ADD CONSTRAINT origin_path_origin_id_path_key UNIQUE (origin_id, path);


--
-- TOC entry 3358 (class 2606 OID 16695)
-- Name: origin_path origin_path_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path
    ADD CONSTRAINT origin_path_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 16809)
-- Name: origin_path_segment origin_path_segment_origin_path_id_origin_segment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_origin_path_id_origin_segment_id_key UNIQUE (origin_path_id, origin_segment_id);


--
-- TOC entry 3382 (class 2606 OID 16807)
-- Name: origin_path_segment origin_path_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_pkey PRIMARY KEY (id);


--
-- TOC entry 3327 (class 2606 OID 16428)
-- Name: origin origin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_pkey PRIMARY KEY (id);


--
-- TOC entry 3351 (class 2606 OID 16677)
-- Name: origin_segment origin_segment_origin_id_text_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment
    ADD CONSTRAINT origin_segment_origin_id_text_hash_key UNIQUE (origin_id, text_hash);


--
-- TOC entry 3353 (class 2606 OID 16675)
-- Name: origin_segment origin_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment
    ADD CONSTRAINT origin_segment_pkey PRIMARY KEY (id);


--
-- TOC entry 3335 (class 2606 OID 16479)
-- Name: _old_pathname pathname_host_id_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname
    ADD CONSTRAINT pathname_host_id_path_key UNIQUE (host_id, path);


--
-- TOC entry 3337 (class 2606 OID 16477)
-- Name: _old_pathname pathname_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname
    ADD CONSTRAINT pathname_pkey PRIMARY KEY (id);


--
-- TOC entry 3346 (class 2606 OID 16520)
-- Name: _old_pathname_translation_v1 pathname_translation_pathname_id_translation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation_v1
    ADD CONSTRAINT pathname_translation_pathname_id_translation_id_key UNIQUE (pathname_id, translation_id);


--
-- TOC entry 3348 (class 2606 OID 16518)
-- Name: _old_pathname_translation_v1 pathname_translation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation_v1
    ADD CONSTRAINT pathname_translation_pkey PRIMARY KEY (id);


--
-- TOC entry 3374 (class 2606 OID 16774)
-- Name: _old_pathname_translation pathname_translation_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation
    ADD CONSTRAINT pathname_translation_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3376 (class 2606 OID 16776)
-- Name: _old_pathname_translation pathname_translation_translated_path_id_translated_segment__key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation
    ADD CONSTRAINT pathname_translation_translated_path_id_translated_segment__key UNIQUE (translated_path_id, translated_segment_id);


--
-- TOC entry 3368 (class 2606 OID 16748)
-- Name: translated_path translated_path_origin_path_id_lang_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_origin_path_id_lang_key UNIQUE (origin_path_id, lang);


--
-- TOC entry 3370 (class 2606 OID 16746)
-- Name: translated_path translated_path_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_pkey PRIMARY KEY (id);


--
-- TOC entry 3362 (class 2606 OID 16720)
-- Name: translated_segment translated_segment_origin_segment_id_lang_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_origin_segment_id_lang_key UNIQUE (origin_segment_id, lang);


--
-- TOC entry 3364 (class 2606 OID 16718)
-- Name: translated_segment translated_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_pkey PRIMARY KEY (id);


--
-- TOC entry 3340 (class 2606 OID 16502)
-- Name: _old_translation translation_host_id_text_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_translation
    ADD CONSTRAINT translation_host_id_text_hash_key UNIQUE (host_id, text_hash);


--
-- TOC entry 3342 (class 2606 OID 16500)
-- Name: _old_translation translation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_translation
    ADD CONSTRAINT translation_pkey PRIMARY KEY (id);


--
-- TOC entry 3320 (class 2606 OID 16413)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 3322 (class 2606 OID 16411)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 3332 (class 1259 OID 16462)
-- Name: idx_host_origin_id; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_host_origin_id ON public.host USING btree (origin_id);


--
-- TOC entry 3354 (class 1259 OID 16760)
-- Name: idx_origin_path_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_path_lookup ON public.origin_path USING btree (origin_id, path);


--
-- TOC entry 3377 (class 1259 OID 16820)
-- Name: idx_origin_path_segment_path; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_path_segment_path ON public.origin_path_segment USING btree (origin_path_id);


--
-- TOC entry 3378 (class 1259 OID 16821)
-- Name: idx_origin_path_segment_segment; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_path_segment_segment ON public.origin_path_segment USING btree (origin_segment_id);


--
-- TOC entry 3349 (class 1259 OID 16759)
-- Name: idx_origin_segment_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_segment_lookup ON public.origin_segment USING btree (origin_id, text_hash);


--
-- TOC entry 3323 (class 1259 OID 16436)
-- Name: idx_origin_user_id; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_origin_user_id ON public.origin USING btree (user_id);


--
-- TOC entry 3333 (class 1259 OID 16485)
-- Name: idx_pathname_host_translated; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_host_translated ON public._old_pathname USING btree (host_id, translated_path);


--
-- TOC entry 3371 (class 1259 OID 16787)
-- Name: idx_pathname_translation_path; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_translation_path ON public._old_pathname_translation USING btree (translated_path_id);


--
-- TOC entry 3343 (class 1259 OID 16531)
-- Name: idx_pathname_translation_pathname; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_translation_pathname ON public._old_pathname_translation_v1 USING btree (pathname_id);


--
-- TOC entry 3344 (class 1259 OID 16532)
-- Name: idx_pathname_translation_reverse; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_translation_reverse ON public._old_pathname_translation_v1 USING btree (translation_id);


--
-- TOC entry 3372 (class 1259 OID 16788)
-- Name: idx_pathname_translation_segment; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_pathname_translation_segment ON public._old_pathname_translation USING btree (translated_segment_id);


--
-- TOC entry 3365 (class 1259 OID 16763)
-- Name: idx_translated_path_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_path_lookup ON public.translated_path USING btree (origin_path_id, lang);


--
-- TOC entry 3366 (class 1259 OID 16764)
-- Name: idx_translated_path_reverse; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_path_reverse ON public.translated_path USING btree (origin_id, lang, translated_path);


--
-- TOC entry 3359 (class 1259 OID 16761)
-- Name: idx_translated_segment_lookup; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_segment_lookup ON public.translated_segment USING btree (origin_segment_id, lang);


--
-- TOC entry 3360 (class 1259 OID 16762)
-- Name: idx_translated_segment_origin_lang; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translated_segment_origin_lang ON public.translated_segment USING btree (origin_id, lang);


--
-- TOC entry 3338 (class 1259 OID 16508)
-- Name: idx_translation_search; Type: INDEX; Schema: public; Owner: postgres_user
--

CREATE INDEX idx_translation_search ON public._old_translation USING btree (host_id, original_text);


--
-- TOC entry 3401 (class 2620 OID 16463)
-- Name: host host_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER host_updated_at BEFORE UPDATE ON public.host FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3400 (class 2620 OID 16437)
-- Name: origin origin_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER origin_updated_at BEFORE UPDATE ON public.origin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3403 (class 2620 OID 16765)
-- Name: translated_segment translated_segment_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER translated_segment_updated_at BEFORE UPDATE ON public.translated_segment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3402 (class 2620 OID 16509)
-- Name: _old_translation translation_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER translation_updated_at BEFORE UPDATE ON public._old_translation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3399 (class 2620 OID 16414)
-- Name: user user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres_user
--

CREATE TRIGGER user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3384 (class 2606 OID 16457)
-- Name: host host_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.host
    ADD CONSTRAINT host_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3390 (class 2606 OID 16698)
-- Name: origin_path origin_path_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path
    ADD CONSTRAINT origin_path_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3397 (class 2606 OID 16810)
-- Name: origin_path_segment origin_path_segment_origin_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_origin_path_id_fkey FOREIGN KEY (origin_path_id) REFERENCES public.origin_path(id) ON DELETE CASCADE;


--
-- TOC entry 3398 (class 2606 OID 16815)
-- Name: origin_path_segment origin_path_segment_origin_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_path_segment
    ADD CONSTRAINT origin_path_segment_origin_segment_id_fkey FOREIGN KEY (origin_segment_id) REFERENCES public.origin_segment(id) ON DELETE CASCADE;


--
-- TOC entry 3389 (class 2606 OID 16678)
-- Name: origin_segment origin_segment_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin_segment
    ADD CONSTRAINT origin_segment_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3383 (class 2606 OID 16431)
-- Name: origin origin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.origin
    ADD CONSTRAINT origin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- TOC entry 3385 (class 2606 OID 16480)
-- Name: _old_pathname pathname_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname
    ADD CONSTRAINT pathname_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.host(id) ON DELETE CASCADE;


--
-- TOC entry 3387 (class 2606 OID 16521)
-- Name: _old_pathname_translation_v1 pathname_translation_pathname_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation_v1
    ADD CONSTRAINT pathname_translation_pathname_id_fkey FOREIGN KEY (pathname_id) REFERENCES public._old_pathname(id) ON DELETE CASCADE;


--
-- TOC entry 3395 (class 2606 OID 16777)
-- Name: _old_pathname_translation pathname_translation_translated_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation
    ADD CONSTRAINT pathname_translation_translated_path_id_fkey FOREIGN KEY (translated_path_id) REFERENCES public.translated_path(id) ON DELETE CASCADE;


--
-- TOC entry 3396 (class 2606 OID 16782)
-- Name: _old_pathname_translation pathname_translation_translated_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation
    ADD CONSTRAINT pathname_translation_translated_segment_id_fkey FOREIGN KEY (translated_segment_id) REFERENCES public.translated_segment(id) ON DELETE CASCADE;


--
-- TOC entry 3388 (class 2606 OID 16526)
-- Name: _old_pathname_translation_v1 pathname_translation_translation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_pathname_translation_v1
    ADD CONSTRAINT pathname_translation_translation_id_fkey FOREIGN KEY (translation_id) REFERENCES public._old_translation(id) ON DELETE CASCADE;


--
-- TOC entry 3393 (class 2606 OID 16749)
-- Name: translated_path translated_path_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3394 (class 2606 OID 16754)
-- Name: translated_path translated_path_origin_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_path
    ADD CONSTRAINT translated_path_origin_path_id_fkey FOREIGN KEY (origin_path_id) REFERENCES public.origin_path(id) ON DELETE CASCADE;


--
-- TOC entry 3391 (class 2606 OID 16721)
-- Name: translated_segment translated_segment_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origin(id) ON DELETE CASCADE;


--
-- TOC entry 3392 (class 2606 OID 16726)
-- Name: translated_segment translated_segment_origin_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public.translated_segment
    ADD CONSTRAINT translated_segment_origin_segment_id_fkey FOREIGN KEY (origin_segment_id) REFERENCES public.origin_segment(id) ON DELETE CASCADE;


--
-- TOC entry 3386 (class 2606 OID 16503)
-- Name: _old_translation translation_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres_user
--

ALTER TABLE ONLY public._old_translation
    ADD CONSTRAINT translation_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.host(id) ON DELETE CASCADE;


--
-- TOC entry 2109 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO postgres_user;


--
-- TOC entry 2111 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO postgres_user;


--
-- TOC entry 2110 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO postgres_user;


--
-- TOC entry 2108 (class 826 OID 16390)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO postgres_user;


-- Completed on 2025-12-29 08:36:55 CST

--
-- PostgreSQL database dump complete
--

\unrestrict yzyQa4n3vzpUOxAxJuPCWoMkQaUgVBHytfvcVmtbz2D3LUwzDDIk8BsbiNDu6H3

