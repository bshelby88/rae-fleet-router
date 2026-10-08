import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", ROOT / "field-guide" / "index.html", ROOT / "request-fit-check" / "index.html"]
HEX64 = re.compile(r"^[0-9a-f]{64}$")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.ids = set()
        self.links = []
        self.scripts = 0
        self.forms = 0
        self.lang = None
        self.title = False
        self.meta_names = set()
        self.canonical = None

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "html": self.lang = values.get("lang")
        if tag == "h1": self.h1 += 1
        if tag == "script": self.scripts += 1
        if tag == "form": self.forms += 1
        if tag == "title": self.title = True
        if "id" in values: self.ids.add(values["id"])
        if tag == "a" and "href" in values: self.links.append(values["href"])
        if tag == "meta" and "name" in values: self.meta_names.add(values["name"])
        if tag == "link" and values.get("rel") == "canonical": self.canonical = values.get("href")


class SiteTests(unittest.TestCase):
    def test_accessibility_metadata_and_no_active_content(self):
        for path in HTML_FILES:
            parser = PageParser(); parser.feed(path.read_text(encoding="utf-8"))
            self.assertEqual(parser.lang, "en")
            self.assertEqual(parser.h1, 1)
            self.assertTrue(parser.title)
            self.assertIn("viewport", parser.meta_names)
            self.assertIn("description", parser.meta_names)
            self.assertTrue(parser.canonical.startswith("https://bshelby88.github.io/rae-endpoint-assurance/"))
            self.assertEqual(parser.scripts, 0)
            self.assertEqual(parser.forms, 0)
            self.assertIn("main", parser.ids)
            self.assertIn("#main", parser.links)

    def test_internal_links_resolve_case_sensitively(self):
        for path in HTML_FILES:
            parser = PageParser(); parser.feed(path.read_text(encoding="utf-8"))
            for href in parser.links:
                if href.startswith(("mailto:", "https:", "#")): continue
                target = (path.parent / href).resolve()
                if href.endswith("/"): target = target / "index.html"
                self.assertTrue(target.exists(), f"Broken link {href} in {path}")

    def test_claim_and_secret_boundaries(self):
        combined = "\n".join(p.read_text(encoding="utf-8") for p in HTML_FILES)
        forbidden = ["fix where feasible", "mutually authorized, reversible bounded fix", "checkout.stripe", "buy now", "api_key", "bearer ", "airtable id", "gmail delivery", "0x7861"]
        for phrase in forbidden:
            self.assertNotIn(phrase, combined.lower())
        self.assertIn("synthetic demonstration", combined.lower())
        self.assertIn("production implementation is excluded", combined.lower())

    def test_tagged_non_binding_cta(self):
        request_page = HTML_FILES[2].read_text(encoding="utf-8")
        parser = PageParser(); parser.feed(request_page)
        mailtos = [x for x in parser.links if x.startswith("mailto:")]
        self.assertEqual(len(mailtos), 1)
        parsed = urlparse(mailtos[0])
        self.assertEqual(parsed.path, "jadedfocus@gmail.com")
        q = parse_qs(parsed.query)
        subject = unquote(q["subject"][0]).lower()
        body = unquote(q["body"][0])
        self.assertIn("non-binding", subject)
        self.assertIn("source=fit-check-page", body)
        self.assertIn("campaign=endpoint-assurance-cycle-4", body)
        self.assertIn("request=fit-check", body)
        for prompt in ["organization=", "requestor role=", "business contact=", "authority confirmed=", "customer-controlled service/domain=", "public url 1=", "public url 2 (optional)=", "public url 3 (optional)=", "observed concern=", "desired assessment window and time zone=", "permission to send one-page scope="]:
            self.assertIn(prompt, body.lower())
        self.assertNotIn("authority confirmed=yes", body.lower())
        self.assertNotIn("permission to send one-page scope=yes", body.lower())
        self.assertLess(len(mailtos[0]), 1800)

    def test_fit_check_is_privacy_minimized_and_non_binding(self):
        page = HTML_FILES[2].read_text(encoding="utf-8").lower()
        for phrase in ["static page collects and transmits nothing", "email provider to the rae gmail inbox", "do not include credentials", "preliminary only", "does not establish operational authority", "does not create an order", "does not authorize testing", "does not collect payment", "proposed founding-client price"]:
            self.assertIn(phrase, page)
        for forbidden in ["<form", "<input", "<script", "<iframe", "password=", "api key=", "customer data=", "localstorage", "document.cookie"]:
            self.assertNotIn(forbidden, page)

    def test_all_conversion_links_route_through_fit_check_page(self):
        for path in HTML_FILES[:2]:
            self.assertIn('href="../request-fit-check/"' if path.parent.name == "field-guide" else 'href="request-fit-check/"', path.read_text(encoding="utf-8"))
        self.assertIn("https://bshelby88.github.io/rae-endpoint-assurance/request-fit-check/", (ROOT / "README.md").read_text(encoding="utf-8"))

    def test_synthetic_sample(self):
        sample = json.loads((ROOT / "field-guide" / "synthetic-sample.json").read_text(encoding="utf-8"))
        self.assertEqual(sample["classification"], "synthetic_example")
        self.assertEqual(sample["inference"], "not_determined")
        self.assertEqual(urlparse(sample["target"]).hostname, "api.example.com")
        self.assertEqual(sample["dns"]["answers"], ["192.0.2.10", "2001:db8::10"])
        self.assertTrue(HEX64.fullmatch(sample["tls"]["certificate_sha256"]))
        self.assertTrue(HEX64.fullmatch(sample["http"]["sanitized_response_sha256"]))
        self.assertTrue(sample["observed_at"].endswith("Z"))

    def test_homepage_canonical_scope(self):
        home = HTML_FILES[0].read_text(encoding="utf-8").lower()
        self.assertIn("1 runbook", home)
        self.assertNotIn("1 fix", home)
        self.assertNotIn("fix where feasible", home)

    def test_readme_treats_airtable_as_routing_only(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8").lower()
        self.assertIn("airtable is a routing and visibility view only", readme)
        self.assertNotIn("canonical airtable", readme)


if __name__ == "__main__":
    unittest.main()
