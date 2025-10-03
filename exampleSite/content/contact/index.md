---
title: Contact
date: 2022-10-24

type: landing

sections:
   - block: contact
    content:
      title: Get in touch
      text: |-
        To get in touch and for information, please fill in the form below.
      address:
        street: Pritchatts Road 52
        postcode: "B15 2SA"
        city: Birmingham
        country: United Kingdom
        country_code: UK
      coordinates:
        latitude: "52.45321698704788"
        longitude: "-1.927825815563642"
      directions: Floor 4 in the Gisbert Kapp Building

      # Automatically link email and phone or display as text?
      autolink: true

      # Email form provider
      form:
        provider: netlify
        formspree:
          id:
        netlify:
          # Enable CAPTCHA challenge to reduce spam?
          captcha: true
    design:
      columns: "1"

  - block: markdown
    content:
      title:
      subtitle: ""
      text:
    design:
      columns: "1"
      background:
        image:
          filename: background.jpg
          filters:
            brightness: 0.5
          parallax: false
          position: center
          size: cover
          text_color_light: true
      spacing:
        padding: ["20px", "0", "20px", "0"]
      css_class: fullscreen
---
