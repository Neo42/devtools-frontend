// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import type * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export const UIStrings = {
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  */
  networkThrottlingProfiles: 'Network Throttling Profiles',
  /**
  *@description Text of add conditions button in Throttling Settings Tab of the Network panel
  */
  addCustomProfile: 'Add custom profile...',
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  *@example {3} PH1
  */
  dms: '{PH1}ms',
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  */
  profileName: 'Profile Name',
  /**
  * @description Label for a textbox that sets the download speed in the Throttling Settings Tab.
  * Noun, short for 'download speed'.
  */
  download: 'Download',
  /**
  * @description Label for a textbox that sets the upload speed in the Throttling Settings Tab.
  * Noun, short for 'upload speed'.
  */
  upload: 'Upload',
  /**
  * @description Label for a textbox that sets the latency in the Throttling Settings Tab.
  */
  latency: 'Latency',
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  */
  kbs: 'kb/s',
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  */
  optional: 'optional',
  /**
  *@description The milisecond unit
  */
  ms: 'ms',
  /**
  *@description Error message for Profile Name input in Throtting pane of the Settings
  *@example {49} PH1
  */
  profileNameCharactersLengthMust: 'Profile Name characters length must be between 1 to {PH1} inclusive',
  /**
  *@description Error message for Download and Upload inputs in Throttling pane of the Settings
  *@example {Download} PH1
  *@example {0} PH2
  *@example {10000000} PH3
  */
  sMustBeANumberBetweenSkbsToSkbs: '{PH1} must be a number between {PH2}kb/s to {PH3}kb/s inclusive',
  /**
  *@description Error message for Latency input in Throttling pane of the Settings
  *@example {0} PH1
  *@example {1000000} PH2
  */
  latencyMustBeAnIntegerBetweenSms: 'Latency must be an integer between {PH1}ms to {PH2}ms inclusive',
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  *@example {25} PH1
  *@example { } PH2
  */
  dskbs: '{PH1}{PH2}kB/s',
  /**
  *@description Text in Throttling Settings Tab of the Network panel
  *@example {25.4} PH1
  *@example { } PH2
  */
  fsmbs: '{PH1}{PH2}MB/s',
};
const str_ = i18n.i18n.registerUIStrings('mobile_throttling/ThrottlingSettingsTab.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let throttlingSettingsTabInstance: ThrottlingSettingsTab;

export class ThrottlingSettingsTab extends UI.Widget.VBox implements
    UI.ListWidget.Delegate<SDK.NetworkManager.Conditions> {
  _list: UI.ListWidget.ListWidget<SDK.NetworkManager.Conditions>;
  _customSetting: Common.Settings.Setting<SDK.NetworkManager.Conditions[]>;
  _editor?: UI.ListWidget.Editor<SDK.NetworkManager.Conditions>;
  constructor() {
    super(true);
    this.registerRequiredCSS('mobile_throttling/throttlingSettingsTab.css', {enableLegacyPatching: true});

    const header = this.contentElement.createChild('div', 'header');
    header.textContent = i18nString(UIStrings.networkThrottlingProfiles);
    UI.ARIAUtils.markAsHeading(header, 1);

    const addButton = UI.UIUtils.createTextButton(
        i18nString(UIStrings.addCustomProfile), this._addButtonClicked.bind(this), 'add-conditions-button');
    this.contentElement.appendChild(addButton);

    this._list = new UI.ListWidget.ListWidget(this);
    this._list.element.classList.add('conditions-list');
    this._list.registerRequiredCSS('mobile_throttling/throttlingSettingsTab.css', {enableLegacyPatching: true});
    this._list.show(this.contentElement);

    this._customSetting = Common.Settings.Settings.instance().moduleSetting('customNetworkConditions');
    this._customSetting.addChangeListener(this._conditionsUpdated, this);

    this.setDefaultFocusedElement(addButton);
  }

  static instance(opts = {forceNew: null}): ThrottlingSettingsTab {
    const {forceNew} = opts;
    if (!throttlingSettingsTabInstance || forceNew) {
      throttlingSettingsTabInstance = new ThrottlingSettingsTab();
    }

    return throttlingSettingsTabInstance;
  }

  wasShown(): void {
    super.wasShown();
    this._conditionsUpdated();
  }

  _conditionsUpdated(): void {
    this._list.clear();

    const conditions = this._customSetting.get();
    for (let i = 0; i < conditions.length; ++i) {
      this._list.appendItem(conditions[i], true);
    }

    this._list.appendSeparator();
  }

  _addButtonClicked(): void {
    this._list.addNewItem(this._customSetting.get().length, {title: '', download: -1, upload: -1, latency: 0});
  }

  renderItem(conditions: SDK.NetworkManager.Conditions, _editable: boolean): Element {
    const element = document.createElement('div');
    element.classList.add('conditions-list-item');
    const title = element.createChild('div', 'conditions-list-text conditions-list-title');
    const titleText = title.createChild('div', 'conditions-list-title-text');
    titleText.textContent = conditions.title;
    UI.Tooltip.Tooltip.install(titleText, conditions.title);
    element.createChild('div', 'conditions-list-separator');
    element.createChild('div', 'conditions-list-text').textContent = throughputText(conditions.download);
    element.createChild('div', 'conditions-list-separator');
    element.createChild('div', 'conditions-list-text').textContent = throughputText(conditions.upload);
    element.createChild('div', 'conditions-list-separator');
    element.createChild('div', 'conditions-list-text').textContent =
        i18nString(UIStrings.dms, {PH1: conditions.latency});
    return element;
  }

  removeItemRequested(_item: SDK.NetworkManager.Conditions, index: number): void {
    const list = this._customSetting.get();
    list.splice(index, 1);
    this._customSetting.set(list);
  }

  commitEdit(
      conditions: SDK.NetworkManager.Conditions, editor: UI.ListWidget.Editor<SDK.NetworkManager.Conditions>,
      isNew: boolean): void {
    conditions.title = editor.control('title').value.trim();
    const download = editor.control('download').value.trim();
    conditions.download = download ? parseInt(download, 10) * (1000 / 8) : -1;
    const upload = editor.control('upload').value.trim();
    conditions.upload = upload ? parseInt(upload, 10) * (1000 / 8) : -1;
    const latency = editor.control('latency').value.trim();
    conditions.latency = latency ? parseInt(latency, 10) : 0;

    const list = this._customSetting.get();
    if (isNew) {
      list.push(conditions);
    }
    this._customSetting.set(list);
  }

  beginEdit(conditions: SDK.NetworkManager.Conditions): UI.ListWidget.Editor<SDK.NetworkManager.Conditions> {
    const editor = this._createEditor();
    editor.control('title').value = conditions.title;
    editor.control('download').value = conditions.download <= 0 ? '' : String(conditions.download / (1000 / 8));
    editor.control('upload').value = conditions.upload <= 0 ? '' : String(conditions.upload / (1000 / 8));
    editor.control('latency').value = conditions.latency ? String(conditions.latency) : '';
    return editor;
  }

  _createEditor(): UI.ListWidget.Editor<SDK.NetworkManager.Conditions> {
    if (this._editor) {
      return this._editor;
    }

    const editor = new UI.ListWidget.Editor<SDK.NetworkManager.Conditions>();
    this._editor = editor;
    const content = editor.contentElement();

    const titles = content.createChild('div', 'conditions-edit-row');
    const nameLabel = titles.createChild('div', 'conditions-list-text conditions-list-title');
    const nameStr = i18nString(UIStrings.profileName);
    nameLabel.textContent = nameStr;
    titles.createChild('div', 'conditions-list-separator conditions-list-separator-invisible');
    const downloadLabel = titles.createChild('div', 'conditions-list-text');
    const downloadStr = i18nString(UIStrings.download);
    downloadLabel.textContent = downloadStr;
    titles.createChild('div', 'conditions-list-separator conditions-list-separator-invisible');
    const uploadLabel = titles.createChild('div', 'conditions-list-text');
    const uploadStr = i18nString(UIStrings.upload);
    uploadLabel.textContent = uploadStr;
    titles.createChild('div', 'conditions-list-separator conditions-list-separator-invisible');
    const latencyLabel = titles.createChild('div', 'conditions-list-text');
    const latencyStr = i18nString(UIStrings.latency);
    latencyLabel.textContent = latencyStr;

    const fields = content.createChild('div', 'conditions-edit-row');
    const nameInput = editor.createInput('title', 'text', '', titleValidator);
    UI.ARIAUtils.setAccessibleName(nameInput, nameStr);
    fields.createChild('div', 'conditions-list-text conditions-list-title').appendChild(nameInput);
    fields.createChild('div', 'conditions-list-separator conditions-list-separator-invisible');

    let cell = fields.createChild('div', 'conditions-list-text');
    const downloadInput = editor.createInput('download', 'text', i18nString(UIStrings.kbs), throughputValidator);
    cell.appendChild(downloadInput);
    UI.ARIAUtils.setAccessibleName(downloadInput, downloadStr);
    const downloadOptional = cell.createChild('div', 'conditions-edit-optional');
    const optionalStr = i18nString(UIStrings.optional);
    downloadOptional.textContent = optionalStr;
    UI.ARIAUtils.setDescription(downloadInput, optionalStr);
    fields.createChild('div', 'conditions-list-separator conditions-list-separator-invisible');

    cell = fields.createChild('div', 'conditions-list-text');
    const uploadInput = editor.createInput('upload', 'text', i18nString(UIStrings.kbs), throughputValidator);
    UI.ARIAUtils.setAccessibleName(uploadInput, uploadStr);
    cell.appendChild(uploadInput);
    const uploadOptional = cell.createChild('div', 'conditions-edit-optional');
    uploadOptional.textContent = optionalStr;
    UI.ARIAUtils.setDescription(uploadInput, optionalStr);
    fields.createChild('div', 'conditions-list-separator conditions-list-separator-invisible');

    cell = fields.createChild('div', 'conditions-list-text');
    const latencyInput = editor.createInput('latency', 'text', i18nString(UIStrings.ms), latencyValidator);
    UI.ARIAUtils.setAccessibleName(latencyInput, latencyStr);
    cell.appendChild(latencyInput);
    const latencyOptional = cell.createChild('div', 'conditions-edit-optional');
    latencyOptional.textContent = optionalStr;
    UI.ARIAUtils.setDescription(latencyInput, optionalStr);

    return editor;

    function titleValidator(
        _item: SDK.NetworkManager.Conditions, _index: number,
        input: HTMLSelectElement|HTMLInputElement): UI.ListWidget.ValidatorResult {
      const maxLength = 49;
      const value = input.value.trim();
      const valid = value.length > 0 && value.length <= maxLength;
      if (!valid) {
        const errorMessage = i18nString(UIStrings.profileNameCharactersLengthMust, {PH1: maxLength});
        return {valid, errorMessage};
      }
      return {valid, errorMessage: undefined};
    }

    function throughputValidator(
        _item: SDK.NetworkManager.Conditions, _index: number,
        input: HTMLSelectElement|HTMLInputElement): UI.ListWidget.ValidatorResult {
      const minThroughput = 0;
      const maxThroughput = 10000000;
      const value = input.value.trim();
      const parsedValue = Number(value);
      const throughput = input.getAttribute('aria-label');
      const valid = !Number.isNaN(parsedValue) && parsedValue >= minThroughput && parsedValue <= maxThroughput;
      if (!valid) {
        const errorMessage = i18nString(
            UIStrings.sMustBeANumberBetweenSkbsToSkbs, {PH1: throughput, PH2: minThroughput, PH3: maxThroughput});
        return {valid, errorMessage};
      }
      return {valid, errorMessage: undefined};
    }

    function latencyValidator(
        _item: SDK.NetworkManager.Conditions, _index: number,
        input: HTMLSelectElement|HTMLInputElement): UI.ListWidget.ValidatorResult {
      const minLatency = 0;
      const maxLatency = 1000000;
      const value = input.value.trim();
      const parsedValue = Number(value);
      const valid = Number.isInteger(parsedValue) && parsedValue >= minLatency && parsedValue <= maxLatency;
      if (!valid) {
        const errorMessage = i18nString(UIStrings.latencyMustBeAnIntegerBetweenSms, {PH1: minLatency, PH2: maxLatency});
        return {valid, errorMessage};
      }
      return {valid, errorMessage: undefined};
    }
  }
}

export function throughputText(throughput: number, plainText?: boolean): string {
  if (throughput < 0) {
    return '';
  }
  const throughputInKbps = throughput / (1000 / 8);
  const delimiter = plainText ? '' : ' ';
  if (throughputInKbps < 1000) {
    return i18nString(UIStrings.dskbs, {PH1: throughputInKbps, PH2: delimiter});
  }
  if (throughputInKbps < 1000 * 10) {
    const formattedResult = (throughputInKbps / 1000).toFixed(1);
    return i18nString(UIStrings.fsmbs, {PH1: formattedResult, PH2: delimiter});
  }
  // TODO(petermarshall): Figure out if there is a difference we need to tell i18n about
  // for these two versions: one with decimal places and one without.
  return i18nString(UIStrings.fsmbs, {PH1: (throughputInKbps / 1000) | 0, PH2: delimiter});
}
