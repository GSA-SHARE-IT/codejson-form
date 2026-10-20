(function () {
    let wired = false;

    function isOptionalComponent(component) {
        if (!component || !component.component) return false;
        const comp = component.component;

        if (comp.type === "button" || comp.type === "content" || comp.type === "password") {
            return false;
        }

        return comp.validate && comp.validate.required === false;
    }

    function wrapField(component) {
        const el = component.element;
        if (!el || !el.parentNode) return;

        if (el.dataset.optionalWrapped === "true") return;
        el.dataset.optionalWrapped = "true";

        const wrapper = document.createElement("div");
        wrapper.className = "optional-field-wrapper";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "optional-field-toggle";
        toggle.setAttribute("aria-expanded", "false");

        const fieldLabel = component.component.label || component.component.key;
        toggle.innerHTML = `<span class="optional-field-toggle-icon" aria-hidden="true">+</span> Add ${fieldLabel}`;

        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(toggle);
        wrapper.appendChild(el);

        el.hidden = true;

        toggle.addEventListener("click", function () {
            setFieldOpen(wrapper, toggle, el, fieldLabel, toggle.getAttribute("aria-expanded") !== "true");
        });

        component._optionalWrapper = wrapper;
        component._optionalToggle = toggle;
        component._optionalLabel = fieldLabel;
    }

    function setFieldOpen(wrapper, toggle, el, fieldLabel, open) {
        el.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.innerHTML = open
            ? `<span class="optional-field-toggle-icon" aria-hidden="true">&minus;</span> Hide ${fieldLabel}`
            : `<span class="optional-field-toggle-icon" aria-hidden="true">+</span> Add ${fieldLabel}`;
    }

    function buildCollapsibleFields() {
        if (wired || !window.formIOInstance) return;

        const form = window.formIOInstance;
        const topLevelComponents = form.components || [];
        const optionalComponents = topLevelComponents.filter(isOptionalComponent);

        if (optionalComponents.length === 0) return;

        optionalComponents.forEach(wrapField);

        form.on("change", function (event) {
            if (!event || !event.changed || !event.changed.component) return;
            const changedKey = event.changed.component.key;

            const match = optionalComponents.find(
                (c) => c.component.key === changedKey
            );

            if (match && match._optionalWrapper) {
                setFieldOpen(
                    match._optionalWrapper,
                    match._optionalToggle,
                    match.element,
                    match._optionalLabel,
                    true
                );
            }
        });

        wired = true;
    }

    function waitForFormThenBuild() {
        if (window.formIOInstance) {
            buildCollapsibleFields();
        } else {
            setTimeout(waitForFormThenBuild, 100);
        }
    }

    document.addEventListener("DOMContentLoaded", waitForFormThenBuild);
})();