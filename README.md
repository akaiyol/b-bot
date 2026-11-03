# b-bot

b-bot is a personal assistant designed to live in Apple Messages and help with the everyday coordination that otherwise gets lost across email, calendars, reminders, and conversations.

## Motivation

I want a useful assistant that can keep track of the details of life, notice what needs attention, and help me follow through—without handing it unchecked control over my accounts or letting it contact other people on my behalf. The design puts safety, verification, privacy, and predictable cost ahead of broad autonomy.

Its intended voice is concise, thoughtful, discerning, ambitious, independent, and direct. Its personality can shape how it helps, but never what it is allowed to do.

## Current status

This repository contains product requirements, an implementation and feasibility plan, development skills, and a local prerequisite check. **There is no working bot yet, and no live account integration has been validated.**

See [REQUIREMENTS.md](REQUIREMENTS.md) for the product source of truth and [IMPLEMENTATION.md](IMPLEMENTATION.md) for feasibility findings, proposed architecture, risks, and validation gates.

## Initial direction

- Use Apple Messages as the phone interface, with a local Mac bridge as the first approach to validate.
- Start with a persistent task list, Gmail, Apple Calendar and Reminders, shipment notices, and a weekly reading digest.
- Begin with read access and require explicit approval for consequential actions.
- Keep replies and alerts private to the owner; do not send messages to other people.
- Use one coordinator by default and add specialist agents only when measured benefit justifies their cost and complexity.

These are requirements and proposals, not implemented capabilities.
