const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAExtendedTaskSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static PARTS = {
    charactersheet: {
      template: "systems/STA/templates/actors/extended-task-sheet.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onWorkTrackUpdate: this.prototype._onWorkTrackUpdate,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 500,
      width: 500
    },
  };

  get title() {
    return `${this.actor.name} - Extended Task`;
  }

  async _prepareContext(options) {
    const context = {
      actor: this.actor,
      enrichedNotes: await TextEditor.enrichHTML(this.actor.system.description),
    };
    return context;
  }

  _onWorkTrackUpdate(event) {
    if (event) {
      const clickedBox = event.target;
      if (!clickedBox || !clickedBox.id.startsWith('box')) return;
      const boxValue = parseInt(clickedBox.textContent, 10);
      const workProgressInput = this.element.querySelector('#work-progress');
      if (workProgressInput) {
        workProgressInput.value = boxValue;
      }
    }
    const workInput = this.element.querySelector('#work');
    const work = parseInt(workInput.value || 0);
    const trackNumber = Math.ceil(work / 5);
    const fullDiv = document.createElement('div');
    fullDiv.style.width = '100%';
    fullDiv.className = 'bar extendedtask';
    for (let i = 0; i < trackNumber; i++) {
      const dividerDiv = document.createElement('div');
      dividerDiv.className = 'extendedtask-divider';
      fullDiv.appendChild(dividerDiv);
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';
      rowDiv.style.width = '100%';
      for (let j = 0; j < 5; j++) {
        const inputDiv = document.createElement('div');
        if (i * 5 + j + 1 <= work) {
          inputDiv.id = `box-${i * 5 + j + 1}`;
          inputDiv.className = 'box extendedtask';
          inputDiv.textContent = i * 5 + j + 1;
          inputDiv.setAttribute('data-action', 'onWorkTrackUpdate');
        }
        inputDiv.style.width = `calc(100% / 5)`;
        rowDiv.appendChild(inputDiv);
      }
      fullDiv.appendChild(rowDiv);
    }
    const renderer = this.element.querySelector('#extendedtask-renderer');
    renderer.innerHTML = '';
    renderer.appendChild(fullDiv);
    const workProgress = this.element.querySelector('#work-progress');
    const boxes = Array.from(this.element.querySelectorAll('[id^="box"]'));
    boxes.forEach((box, index) => {
      box.classList.add('extendedtask');
      if (index + 1 <= workProgress.value) {
        box.setAttribute('data-selected', 'true');
        box.classList.add('selected');
      } else {
        box.removeAttribute('data-selected');
        box.classList.remove('selected');
      }
    });
    this.submit();
  }

  _onRender(context, options) {
    this._onWorkTrackUpdate();
  }
}