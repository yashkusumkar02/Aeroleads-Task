SELECTORS = {
    # Top profile basics
    "name": [
        "h1.text-heading-xlarge",
        ".pv-text-details__left-panel h1",
        ".pv-top-card--list li.inline.t-24",
    ],
    "headline": [
        ".text-body-medium.break-words",
        ".pv-text-details__left-panel .text-body-medium",
        ".pv-top-card .t-18.t-black",
    ],
    "location": [
        ".pv-text-details__left-panel .text-body-small",
        ".pv-text-details__left-panel .text-body-small.inline.t-black--light",
        ".pv-top-card .pv-top-card--list-bullet .t-16.t-black--light",
        "section.top-card-layout .top-card-layout__entity-info .text-body-small",
    ],
    "about": [
        "section.pv-about-section .lt-line-clamp__raw-line",
        "section.pv-about-section .inline-show-more-text",
        "section.artdeco-card.break-words .pv-shared-text-with-see-more .inline-show-more-text",
    ],
    # Profile avatar image
    "image": [
        "img.pv-top-card-profile-picture__image",
        "img.pv-top-card__photo",
        "img.profile-photo-edit__preview",
    ],
    # Experience section
    "experience_section": [
        "section#experience",
        "section.pv-experience-section",
        "section:has(h2:contains('Experience'))",
    ],
    "experience_items": [
        "section#experience li.pvs-list__item",
        "section.pv-experience-section li.pv-entity__position-group-pager",
        "section#experience .scaffold-finite-scroll__content li",
    ],
    # Education section
    "education_section": [
        "section#education",
        "section.pv-education-section",
        "section:has(h2:contains('Education'))",
    ],
    "education_items": [
        "section#education li.pvs-list__item",
        "section.pv-education-section li.pv-profile-section__list-item",
        "section#education .scaffold-finite-scroll__content li",
    ],
    # Projects section (best-effort)
    "projects_section": [
        "section:has(h2:contains('Projects'))",
        "section#projects",
        "section.pv-projects-section",
    ],
    "projects_items": [
        "section:has(h2:contains('Projects')) li.pvs-list__item",
        "section#projects li.pvs-list__item",
    ],
    # Skills
    "skills_section": [
        "section:has(h2:contains('Skills'))",
        "section#skills",
        "section.pv-skill-categories-section",
    ],
    "skills_items": [
        "section:has(h2:contains('Skills')) span.pv-skill-category-entity__name-text",
        "section#skills span.pvs-list__item .mr1.t-bold",
        "section#skills span.pv-skill-category-entity__name-text",
    ],
}


