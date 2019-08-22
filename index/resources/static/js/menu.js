let menu = {
    // Attributes
    workers: {},
    workersCount: 0,

    // Init

    init: function(data) {
        // Loop through workers
        if (typeof data.workers !== "undefined") {
            for (let k = 0; k < data.workers.length; k++) {
                menu.addWorker(data.workers[k])
            }
        }
    },

    // Worker

    addWorker: function(data) {
        // Worker already exists
        if (typeof menu.workers[data.name] !== "undefined") {
            return
        }

        // Create worker
        let worker = menu.newWorker(data)

        // Add in alphabetical order
        asticode.tools.appendSorted(document.querySelector("#menu"), worker, menu.workers)

        // Append to pool
        menu.workers[worker.name] = worker

        // Update workers count
        menu.updateWorkersCount(1)
    },
    newWorker: function(data) {
        // Init
        let r = {
            abilities: {},
            html: {},
            name: data.name,
        }

        // Create wrapper
        r.html.wrapper = document.createElement("div")
        r.html.wrapper.className = "menu-worker"

        // Create name
        let name = document.createElement("div")
        name.className = "menu-worker-name"
        name.innerText = data.name
        r.html.wrapper.appendChild(name)

        // Create table
        r.html.table = document.createElement("div")
        r.html.table.className = "table"
        r.html.wrapper.appendChild(r.html.table)

        // Loop through abilities
        if (typeof data.abilities !== "undefined") {
            for (let k = 0; k < data.abilities.length; k++) {
                menu.addAbility(r, data.abilities[k])
            }
        }
        return r
    },
    removeWorker: function(data) {
        // Fetch worker
        let worker = menu.workers[data.name]

        // Worker exists
        if (typeof worker !== "undefined") {
            // Remove HTML
            worker.html.wrapper.remove()

            // Delete from pool
            delete(menu.workers[data.name])

            // Update workers count
            menu.updateWorkersCount(-1)
        }
    },
    updateWorkersCount: function(delta) {
        // Update workers count
        menu.workersCount += delta

        // Hide worker name
        let items = document.querySelectorAll(".menu-worker-name")
        if (menu.workersCount > 1) {
            items.forEach(function(item) { item.style.display = "block" })
        } else {
            items.forEach(function(item) { item.style.display = "none" })
        }
    },

    // Ability

    addAbility: function(worker, data) {
        // Ability already exists
        if (typeof worker.abilities[data.name] !== "undefined") {
            return
        }

        // Create ability
        let ability = menu.newAbility(worker, data)

        // Add in alphabetical order
        asticode.tools.appendSorted(worker.html.table, ability, worker.abilities)

        // Append to pool
        worker.abilities[ability.name] = ability
    },
    newAbility: function(worker, data) {
        // Create results
        let r = {
            worker_name: worker.name,
            description: data.description,
            html: {},
            name: data.name,
            status: data.status,
            web_homepage: data.web_homepage,
        }

        // Create wrapper
        r.html.wrapper = document.createElement("div")
        r.html.wrapper.className = "row"
        r.html.wrapper.title = r.description

        // Create title
        let title = r.name
        if (typeof r.web_homepage !== "undefined") {
            title = document.createElement("a")
            title.href = r.web_homepage
            title.innerText = r.name
        }

        // Create name
        let name = document.createElement("div")
        name.className = "cell"
        name.style.paddingRight = "10px"
        name.innerHTML = title
        r.html.wrapper.appendChild(name)

        // Create toggle cell
        let cell = document.createElement("div")
        cell.class = "cell"
        r.html.wrapper.appendChild(cell)

        // Create toggle
        r.html.toggle = document.createElement("label")
        r.html.toggle.className = "toggle " + menu.toggleClass(data.status)
        r.html.toggle.innerHTML = '<span class="slider"></span>'
        r.html.toggle.click(function() {
            // TODO
            /*base.sendWs(r.is_on ? consts.websocket.eventNames.abilityStop : consts.websocket.eventNames.abilityStart, {
                worker_name: r.worker_name,
                name: r.name,
            })*/
        })
        cell.appendChild(r.html.toggle)
        return r
    },
    updateToggle: function(data) {
        // Fetch worker
        let worker = menu.workers[data.worker_name]

        // Worker exists
        if (typeof worker !== "undefined") {
            // Fetch ability
            let ability = worker.abilities[data.name]

            // Ability exists
            if (typeof ability !== "undefined") {
                // Update class
                asticode.tools.removeClass(ability.html.toggle, "on")
                asticode.tools.removeClass(ability.html.toggle, "off")
                asticode.tools.addClass(ability.html.toggle, menu.toggleClass(data.status))

                // Update attribute
                ability.status = data.status
            }
        }
    },
    toggleClass: function(status) {
        return status === "running" ? "on" : "off"
    }
}