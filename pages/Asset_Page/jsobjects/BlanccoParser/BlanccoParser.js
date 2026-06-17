export default {
  getXml() {
    let xml = BlanccoSearch.data?.response || BlanccoSearch.data || "";

    if (typeof xml !== "string") {
      xml = JSON.stringify(xml);
    }

    return xml
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  },

getRequestedSerial() {
  try {
    return qry_GetAssetById.data?.[0]?.serial_number || "";
  } catch (e) {
    return "";
  }
},
  

  getMatchingReportXml() {
    const xml = this.getXml();
    const serial = this.getRequestedSerial();

    if (!serial) return xml;

    const reports = [...xml.matchAll(/<report\b[^>]*>[\s\S]*?<\/report>/g)].map(m => m[0]);

    if (!reports.length) return xml;

    return reports.find(r => r.includes(serial)) || "";
  },

  escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  getEntryFromXml(xml, sectionName, tagName, occurrence = 0) {
    if (!xml || !sectionName || !tagName) return "";

    const safeSectionName = this.escapeRegExp(sectionName);
    const safeTagName = this.escapeRegExp(tagName);

    const sectionRegex = new RegExp(
      `<entries name="${safeSectionName}">([\\s\\S]*?)<\\/entries>`,
      "g"
    );

    const sections = [...xml.matchAll(sectionRegex)];
    let values = [];

    sections.forEach(section => {
      const sectionXml = section[1];

      const entryRegex = new RegExp(
        `<entry name="${safeTagName}"[^>]*>(.*?)<\\/entry>`,
        "gs"
      );

      const matches = [...sectionXml.matchAll(entryRegex)];
      values.push(...matches.map(m => m[1].trim()));
    });

    return values[occurrence] || "";
  },

  getRawEntry(tagName, occurrence = 0) {
    const xml = this.getMatchingReportXml() || this.getXml();

    if (!xml || !tagName) return "";

    const safeTagName = this.escapeRegExp(tagName);

    const regex = new RegExp(
      `<entry name="${safeTagName}"[^>]*>(.*?)<\\/entry>`,
      "gs"
    );

    const matches = [...xml.matchAll(regex)];

    return matches[occurrence]?.[1]?.trim() || "";
  },

  getEntry(sectionName, tagName, occurrence = 0) {
    return this.getEntryFromXml(
      this.getMatchingReportXml(),
      sectionName,
      tagName,
      occurrence
    );
  },

  getEntryFromFullXml(sectionName, tagName, occurrence = 0) {
    return this.getEntryFromXml(
      this.getXml(),
      sectionName,
      tagName,
      occurrence
    );
  },

  cleanValue(value) {
    return value ? String(value).trim() : "";
  },

  firstValue(...values) {
    return values.find(v => v !== undefined && v !== null && String(v).trim() !== "") || "";
  },

  looksLikeReportId(value) {
    const id = this.cleanValue(value);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  },

  bytesToGB(value) {
    const bytes = Number(value);
    return bytes ? Math.round(bytes / 1024 / 1024 / 1024) + "GB" : "";
  },

  bytesToGBDecimal(value) {
    const bytes = Number(value);
    return bytes ? Math.round(bytes / 1000 / 1000 / 1000) + "GB" : "";
  },

  normaliseMemory(value) {
    const raw = this.cleanValue(value);
    if (!raw) return "";

    const text = String(raw).trim();

    const unitMatch = text.match(/^([\d.]+)\s*(gb|gib|mb|mib|tb|tib)$/i);
    if (unitMatch) {
      const num = Number(unitMatch[1]);
      const unit = unitMatch[2].toLowerCase();

      if (unit === "gb" || unit === "gib") return Math.round(num) + "GB";
      if (unit === "mb" || unit === "mib") return Math.round(num / 1024) + "GB";
      if (unit === "tb" || unit === "tib") return Math.round(num * 1024) + "GB";
    }

    const numberOnly = Number(text.replace(/,/g, ""));
    if (!numberOnly) return text;

    if (numberOnly > 0 && numberOnly <= 512) {
      return Math.round(numberOnly) + "GB";
    }

    if (numberOnly >= 1024 && numberOnly < 1000000) {
      return Math.round(numberOnly / 1024) + "GB";
    }

    if (numberOnly >= 1000000000) {
      return Math.round(numberOnly / 1024 / 1024 / 1024) + "GB";
    }

    return text;
  },

  normaliseStorage(value) {
    const raw = this.cleanValue(value);
    if (!raw) return "";

    const text = String(raw).trim();

    const unitMatch = text.match(/^([\d.]+)\s*(gb|gib|mb|mib|tb|tib)$/i);
    if (unitMatch) {
      const num = Number(unitMatch[1]);
      const unit = unitMatch[2].toLowerCase();

      if (unit === "gb" || unit === "gib") return Math.round(num) + "GB";
      if (unit === "mb" || unit === "mib") return Math.round(num / 1000) + "GB";
      if (unit === "tb" || unit === "tib") return Math.round(num * 1000) + "GB";
    }

    const numberOnly = Number(text.replace(/,/g, ""));
    if (!numberOnly) return text;

    if (numberOnly > 0 && numberOnly <= 10000) {
      return Math.round(numberOnly) + "GB";
    }

    if (numberOnly >= 1000000000) {
      return Math.round(numberOnly / 1000 / 1000 / 1000) + "GB";
    }

    return text;
  },

  normaliseYear(value) {
    const raw = this.cleanValue(value);
    if (!raw) return "";

    const match = String(raw).match(/\b(19[8-9]\d|20[0-3]\d)\b/);
    return match ? match[1] : "";
  },

  extractYearFromText(value) {
    return this.normaliseYear(value);
  },

  cleanAppleMake(make) {
    if (!make) return "";
    return String(make).toLowerCase().includes("apple") ? "Apple" : make;
  },

  extractAppleProcessor(model) {
    if (!model) return "";

    const match = String(model).match(/\((.*?)(,|$)/);

    return match ? match[1].trim() : "";
  },

  extractAppleGpu(processorOrModel) {
    const text = this.cleanValue(processorOrModel);
    if (!text) return "";

    const appleChipMatch = text.match(/\b(M1|M1 Pro|M1 Max|M1 Ultra|M2|M2 Pro|M2 Max|M2 Ultra|M3|M3 Pro|M3 Max|M4|M4 Pro|M4 Max)\b/i);

    if (!appleChipMatch) return "";

    return `Apple ${appleChipMatch[1]} Integrated GPU`;
  },

  addPercent(value) {
    if (!value) return "";
    return String(value).includes("%") ? value : value + "%";
  },

  getBatteryHealthFromRawText() {
    const xml = this.getXml();

    const match =
      xml.match(/(\d+)%\s*\(&lt;\s*80%\)/) ||
      xml.match(/(\d+)%\s*\(<\s*80%\)/) ||
      xml.match(/<entry name="comment"[^>]*>\s*(\d+)%/);

    return match?.[1] || "";
  },

  findAny(searchText = "") {
    const xml = this.getXml();

    const regex = /<entry name="([^"]+)"[^>]*>(.*?)<\/entry>/gs;
    const entries = [...xml.matchAll(regex)];

    return entries
      .map((m, index) => ({
        index,
        tag: m[1],
        value: m[2].trim()
      }))
      .filter(row =>
        row.tag.toLowerCase().includes(searchText.toLowerCase()) ||
        row.value.toLowerCase().includes(searchText.toLowerCase())
      );
  },

  findRawText(searchText = "") {
    const xml = this.getXml();
    const pos = xml.toLowerCase().indexOf(searchText.toLowerCase());

    return {
      found: pos >= 0,
      position: pos,
      preview: pos >= 0 ? xml.substring(Math.max(0, pos - 300), pos + 500) : ""
    };
  },

  findTags(searchText = "") {
    const xml = this.getMatchingReportXml() || this.getXml();
    const rows = [];

    const regex = /<entries name="([^"]+)">([\s\S]*?)<\/entries>/g;
    const sections = [...xml.matchAll(regex)];

    sections.forEach(sectionMatch => {
      const section = sectionMatch[1];
      const sectionXml = sectionMatch[2];

      const entryRegex = /<entry name="([^"]+)"[^>]*>(.*?)<\/entry>/gs;
      const entries = [...sectionXml.matchAll(entryRegex)];

      entries.forEach((entryMatch, index) => {
        rows.push({
          section,
          index,
          tag: entryMatch[1],
          value: entryMatch[2].trim()
        });
      });
    });

    return rows.filter(row =>
      !searchText ||
      row.section.toLowerCase().includes(searchText.toLowerCase()) ||
      row.tag.toLowerCase().includes(searchText.toLowerCase()) ||
      row.value.toLowerCase().includes(searchText.toLowerCase())
    );
  },

  getReportId() {
    const xml = this.getMatchingReportXml() || this.getXml();
    const raw = BlanccoSearch.data;

    if (!xml && !raw) return "";

    const rawText =
      typeof raw === "string"
        ? raw
        : JSON.stringify(raw || {});

    const combinedText = `${rawText} ${xml || ""}`;

    const documentIdMatch = combinedText.match(
      /<document_id>\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*<\/document_id>/i
    );

    if (documentIdMatch?.[1]) {
      return documentIdMatch[1];
    }

    const escapedDocumentIdMatch = combinedText.match(
      /document_id[^0-9a-f]*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );

    if (escapedDocumentIdMatch?.[1]) {
      return escapedDocumentIdMatch[1];
    }

    const reportUrlMatch = combinedText.match(
      /\/api\/reports\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );

    if (reportUrlMatch?.[1]) {
      return reportUrlMatch[1];
    }

    const possibleIds = [
      this.getRawEntry("document_id"),
      this.getRawEntry("report_id"),
      this.getRawEntry("blancco_report_id"),
      this.getRawEntry("erasure_report_id"),
      this.getRawEntry("report_uuid"),
      this.getRawEntry("certificate_report_id"),
      this.getRawEntry("html_report_id")
    ];

    const validFieldId = possibleIds.find(id => this.looksLikeReportId(id));

    if (validFieldId) {
      return validFieldId;
    }

    const reportTag = xml.match(/<report\b([^>]*)>/i)?.[1] || "";

    const attrIds = [
      reportTag.match(/\bid="([^"]+)"/i)?.[1],
      reportTag.match(/\breport_id="([^"]+)"/i)?.[1],
      reportTag.match(/\breport_uuid="([^"]+)"/i)?.[1]
    ];

    const validAttrId = attrIds.find(id => this.looksLikeReportId(id));

    if (validAttrId) {
      return validAttrId;
    }

    return "";
  },

  getReportUrl() {
    const xml = this.getMatchingReportXml() || this.getXml();
    const raw = BlanccoSearch.data;

    const rawText =
      typeof raw === "string"
        ? raw
        : JSON.stringify(raw || {});

    const combinedText = `${rawText} ${xml || ""}`;

    const fullUrlMatch = combinedText.match(
      /https:\/\/[^\s"'<>]*\/api\/reports\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[^\s"'<>]*/i
    );

    if (fullUrlMatch?.[0]) {
      return fullUrlMatch[0]
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&");
    }

    const reportId = this.getReportId();

    if (!reportId) return "";

    return (
      "https://oliver-eu-west-1.portal.blancco.cloud/api/reports/" +
      reportId +
      "?language=en_US&format=HTML"
    );
  },

  parseBlancco() {
    const requestedSerial = this.cleanValue(this.getRequestedSerial());

    const returnedSerial =
      this.getEntry("system", "serial") ||
      this.getRawEntry("@system_serial") ||
      this.getRawEntry("serial") ||
      this.getRawEntry("system_serial") ||
      this.getRawEntry("blancco_hardware_report.system.serial");

    const batteryHealth =
      this.getEntry("mobile_battery", "battery_health_metric", 1) ||
      this.getEntry("mobile_battery", "battery_health_metric", 0) ||
      this.getEntry("battery_mobile", "battery_health_metric", 1) ||
      this.getEntry("battery_mobile", "battery_health_metric", 0) ||
      this.getEntry("battery_capacity", "capacity", 0) ||
      this.getEntryFromFullXml("mobile_battery", "battery_health_metric", 1) ||
      this.getEntryFromFullXml("mobile_battery", "battery_health_metric", 0) ||
      this.getEntryFromFullXml("battery_mobile", "battery_health_metric", 1) ||
      this.getEntryFromFullXml("battery_mobile", "battery_health_metric", 0) ||
      this.getEntryFromFullXml("battery_capacity", "capacity", 0) ||
      this.getBatteryHealthFromRawText();

    const makeValue =
      this.getEntry("system", "manufacturer") ||
      this.getRawEntry("manufacturer") ||
      this.getRawEntry("make") ||
      this.getRawEntry("blancco_hardware_report.system.manufacturer");

    const modelValue =
      this.getEntry("system", "model") ||
      this.getRawEntry("model") ||
      this.getRawEntry("system_model") ||
      this.getRawEntry("product_model") ||
      this.getRawEntry("blancco_hardware_report.system.model");

    const productNameValue =
      this.getEntry("system", "product_name") ||
      this.getRawEntry("product_name") ||
      this.getRawEntry("product") ||
      this.getRawEntry("blancco_hardware_report.system.product_name");

    const processorValue =
      this.getEntry("processors", "model") ||
      this.getEntry("processor", "model") ||
      this.getEntry("cpu", "model") ||
      this.getRawEntry("processor") ||
      this.getRawEntry("processor_model") ||
      this.getRawEntry("cpu") ||
      this.getRawEntry("cpu_model") ||
      this.getRawEntry("chip") ||
      this.getRawEntry("soc") ||
      this.getRawEntry("blancco_hardware_report.processors.model") ||
      this.extractAppleProcessor(modelValue || productNameValue);

    const yearValue =
      this.normaliseYear(this.getEntry("system", "year")) ||
      this.normaliseYear(this.getEntry("system", "manufacture_year")) ||
      this.normaliseYear(this.getEntry("system", "release_year")) ||
      this.normaliseYear(this.getEntry("system", "model_year")) ||
      this.normaliseYear(this.getEntry("bios", "date")) ||
      this.normaliseYear(this.getRawEntry("year")) ||
      this.normaliseYear(this.getRawEntry("manufacture_year")) ||
      this.normaliseYear(this.getRawEntry("manufactured_year")) ||
      this.normaliseYear(this.getRawEntry("release_year")) ||
      this.normaliseYear(this.getRawEntry("model_year")) ||
      this.normaliseYear(this.getRawEntry("production_year")) ||
      this.normaliseYear(this.getRawEntry("device_year")) ||
      this.normaliseYear(this.getRawEntry("blancco_hardware_report.system.year")) ||
      this.normaliseYear(this.getRawEntry("blancco_hardware_report.system.manufacture_year")) ||
      this.normaliseYear(this.getRawEntry("blancco_hardware_report.system.release_year")) ||
      this.extractYearFromText(modelValue) ||
      this.extractYearFromText(productNameValue);

    const ramValue =
      this.bytesToGB(this.getEntry("memory", "total_memory")) ||
      this.normaliseMemory(this.getEntry("memory", "total_memory")) ||
      this.normaliseMemory(this.getEntry("memory", "physical_memory")) ||
      this.normaliseMemory(this.getEntry("memory", "installed_memory")) ||
      this.normaliseMemory(this.getEntry("memory", "system_memory")) ||
      this.normaliseMemory(this.getEntry("memory", "memory_size")) ||
      this.normaliseMemory(this.getEntry("memory", "size")) ||
      this.normaliseMemory(this.getEntry("memories", "total_memory")) ||
      this.normaliseMemory(this.getEntry("memories", "physical_memory")) ||
      this.normaliseMemory(this.getEntry("memories", "installed_memory")) ||
      this.normaliseMemory(this.getEntry("memories", "system_memory")) ||
      this.normaliseMemory(this.getEntry("memories", "memory_size")) ||
      this.normaliseMemory(this.getEntry("memories", "size")) ||
      this.normaliseMemory(this.getEntry("system", "memory")) ||
      this.normaliseMemory(this.getEntry("system", "ram")) ||
      this.normaliseMemory(this.getEntry("system", "physical_memory")) ||
      this.normaliseMemory(this.getEntry("system", "total_memory")) ||
      this.normaliseMemory(this.getEntryFromFullXml("memory", "total_memory")) ||
      this.normaliseMemory(this.getEntryFromFullXml("memory", "physical_memory")) ||
      this.normaliseMemory(this.getEntryFromFullXml("memory", "installed_memory")) ||
      this.normaliseMemory(this.getEntryFromFullXml("memory", "system_memory")) ||
      this.normaliseMemory(this.getEntryFromFullXml("memory", "memory_size")) ||
      this.normaliseMemory(this.getEntryFromFullXml("memory", "size")) ||
      this.normaliseMemory(this.getRawEntry("blancco_hardware_report.memory.physical_memory")) ||
      this.normaliseMemory(this.getRawEntry("blancco_hardware_report.memory.total_memory")) ||
      this.normaliseMemory(this.getRawEntry("blancco_hardware_report.memory.installed_memory")) ||
      this.normaliseMemory(this.getRawEntry("blancco_hardware_report.memory.system_memory")) ||
      this.normaliseMemory(this.getRawEntry("blancco_hardware_report.memory.memory_size")) ||
      this.normaliseMemory(this.getRawEntry("blancco_hardware_report.memory.size")) ||
      this.normaliseMemory(this.getRawEntry("physical_memory")) ||
      this.normaliseMemory(this.getRawEntry("total_memory")) ||
      this.normaliseMemory(this.getRawEntry("installed_memory")) ||
      this.normaliseMemory(this.getRawEntry("system_memory")) ||
      this.normaliseMemory(this.getRawEntry("memory_size")) ||
      this.normaliseMemory(this.getRawEntry("memory")) ||
      this.normaliseMemory(this.getRawEntry("ram")) ||
      this.normaliseMemory(this.getRawEntry("ram_size"));

    const gpuValue =
      this.getEntry("video_cards", "model") ||
      this.getEntry("video_card", "model") ||
      this.getEntry("graphics_cards", "model") ||
      this.getEntry("graphics_card", "model") ||
      this.getEntry("graphics", "model") ||
      this.getEntry("gpu", "model") ||
      this.getEntry("display_adapters", "model") ||
      this.getEntry("display_adapter", "model") ||
      this.getEntryFromFullXml("video_cards", "model") ||
      this.getEntryFromFullXml("graphics_cards", "model") ||
      this.getEntryFromFullXml("graphics", "model") ||
      this.getRawEntry("gpu") ||
      this.getRawEntry("gpu_model") ||
      this.getRawEntry("graphics") ||
      this.getRawEntry("graphics_model") ||
      this.getRawEntry("graphics_card") ||
      this.getRawEntry("graphics_card_model") ||
      this.getRawEntry("video_card") ||
      this.getRawEntry("video_card_model") ||
      this.getRawEntry("display_adapter") ||
      this.getRawEntry("display_adapter_model") ||
      this.getRawEntry("vga") ||
      this.getRawEntry("vga_model") ||
      this.getRawEntry("blancco_hardware_report.video_cards.model") ||
      this.getRawEntry("blancco_hardware_report.graphics_cards.model") ||
      this.getRawEntry("blancco_hardware_report.graphics.model") ||
      this.extractAppleGpu(processorValue || modelValue || productNameValue);

    const driveCapacityValue =
      this.bytesToGBDecimal(this.getEntry("disks", "capacity")) ||
      this.normaliseStorage(this.getEntry("disks", "size")) ||
      this.normaliseStorage(this.getEntry("storage", "capacity")) ||
      this.normaliseStorage(this.getEntry("storage", "size")) ||
      this.normaliseStorage(this.getRawEntry("drive_capacity")) ||
      this.normaliseStorage(this.getRawEntry("disk_capacity")) ||
      this.normaliseStorage(this.getRawEntry("storage_capacity")) ||
      this.normaliseStorage(this.getRawEntry("storage")) ||
      this.normaliseStorage(this.getRawEntry("hdd")) ||
      this.normaliseStorage(this.getRawEntry("ssd")) ||
      this.normaliseStorage(this.getRawEntry("blancco_hardware_report.disks.capacity"));

    const result = {
      requested_serial: requestedSerial,
      returned_serial: returnedSerial,
      serial_match:
        requestedSerial &&
        returnedSerial &&
        requestedSerial.toUpperCase() === returnedSerial.toUpperCase(),

      serial: returnedSerial,

      asset_tag:
        this.getEntry("system", "asset_tag") ||
        this.getRawEntry("asset_tag"),

      manufacturer: makeValue,
      make: makeValue,
      model: modelValue,
      product_name: productNameValue,

      family:
        this.getEntry("system", "family") ||
        this.getRawEntry("family") ||
        this.getRawEntry("device_family"),

      model_id:
        this.getEntry("system", "model_id") ||
        this.getRawEntry("model_id") ||
        this.getRawEntry("apple_model_number") ||
        this.getRawEntry("apple_model_id"),

      year: yearValue,

      bios_version:
        this.getEntry("bios", "version") ||
        this.getRawEntry("bios_version") ||
        this.getRawEntry("version"),

      bios_date:
        this.getEntry("bios", "date") ||
        this.getRawEntry("bios_date"),

      uuid:
        this.getEntry("system", "uuid") ||
        this.getRawEntry("uuid"),

      processor: processorValue,

      processor_speed:
        this.getEntry("processors", "speed") ||
        this.getEntry("processor", "speed") ||
        this.getEntry("cpu", "speed") ||
        this.getRawEntry("processor_speed") ||
        this.getRawEntry("cpu_speed"),

      processor_cores:
        this.getEntry("processors", "cores") ||
        this.getEntry("processor", "cores") ||
        this.getEntry("cpu", "cores") ||
        this.getRawEntry("cores") ||
        this.getRawEntry("processor_cores") ||
        this.getRawEntry("cpu_cores"),

      ram: ramValue,

      memory_type:
        this.getEntry("memory", "type") ||
        this.getEntry("memories", "type") ||
        this.getRawEntry("memory_type") ||
        this.getRawEntry("ram_type"),

      drive_model:
        this.getEntry("disks", "model") ||
        this.getRawEntry("drive_model") ||
        this.getRawEntry("disk_model") ||
        this.getRawEntry("storage_model"),

      drive_serial:
        this.getEntry("disks", "serial") ||
        this.getRawEntry("drive_serial") ||
        this.getRawEntry("disk_serial") ||
        this.getRawEntry("storage_serial"),

      drive_interface:
        this.getEntry("disks", "interface_type") ||
        this.getEntry("disks", "interface") ||
        this.getRawEntry("drive_interface") ||
        this.getRawEntry("interface_type"),

      drive_capacity: driveCapacityValue,
      hdd: driveCapacityValue,

      drive_health:
        this.getEntry("disks", "health") ||
        this.getRawEntry("drive_health") ||
        this.getRawEntry("disk_health"),

      drive_power_on_hours:
        this.getEntry("disks", "power_on_hours") ||
        this.getRawEntry("power_on_hours"),

      drive_type:
        this.getEntry("disks", "type") ||
        this.getRawEntry("drive_type") ||
        this.getRawEntry("disk_type") ||
        this.getRawEntry("storage_type"),

      gpu: gpuValue,

      screen_size:
        this.getEntry("displays", "size") ||
        this.getEntry("display", "size") ||
        this.getRawEntry("screen_size") ||
        this.getRawEntry("display_size"),

      screen_resolution:
        this.getEntry("displays", "resolution") ||
        this.getEntry("display", "resolution") ||
        this.getRawEntry("screen_resolution") ||
        this.getRawEntry("display_resolution") ||
        this.getRawEntry("resolution"),

      touchscreen:
        this.getEntry("displays", "touchscreen") ||
        this.getEntry("display", "touchscreen") ||
        this.getRawEntry("touchscreen"),

      battery_health:
        this.addPercent(batteryHealth),

      battery_cycle_count:
        this.getEntry("mobile_battery", "cycle_count") ||
        this.getEntry("battery_mobile", "cycle_count") ||
        this.getRawEntry("cycle_count") ||
        this.getRawEntry("battery_cycle_count"),

      battery_serial:
        this.getEntry("mobile_battery", "serial") ||
        this.getEntry("battery_mobile", "serial") ||
        this.getRawEntry("battery_serial"),

      battery_manufacturer:
        this.getEntry("mobile_battery", "manufacturer") ||
        this.getEntry("battery_mobile", "manufacturer") ||
        this.getRawEntry("battery_manufacturer"),

      battery_design_capacity:
        this.getEntry("mobile_battery", "design_capacity") ||
        this.getEntry("battery_mobile", "design_capacity") ||
        this.getRawEntry("design_capacity"),

      battery_full_charge_capacity:
        this.getEntry("mobile_battery", "full_charge_capacity") ||
        this.getEntry("battery_mobile", "full_charge_capacity") ||
        this.getRawEntry("full_charge_capacity"),

      wifi:
        this.getEntry("network_adapters", "wireless") ||
        this.getRawEntry("wifi") ||
        this.getRawEntry("wireless"),

      ethernet_mac:
        this.getEntry("network_adapters", "mac_address") ||
        this.getRawEntry("mac_address") ||
        this.getRawEntry("ethernet_mac"),

      imei:
        this.getEntry("mobile", "imei") ||
        this.getRawEntry("imei"),

      meid:
        this.getEntry("mobile", "meid") ||
        this.getRawEntry("meid"),

      sim_status:
        this.getEntry("mobile", "sim_status") ||
        this.getRawEntry("sim_status"),

      secure_boot:
        this.getEntry("system", "secure_boot") ||
        this.getRawEntry("secure_boot"),

      tpm:
        this.getEntry("system", "tpm") ||
        this.getRawEntry("tpm"),

      computrace:
        this.getEntry("system", "computrace") ||
        this.getRawEntry("computrace"),

      mdm_lock:
        this.getEntry("system", "mdm_lock") ||
        this.getRawEntry("mdm_lock"),

      icloud_lock:
        this.getEntry("system", "icloud_lock") ||
        this.getRawEntry("icloud_lock"),

      bios_lock:
        this.getEntry("system", "bios_lock") ||
        this.getRawEntry("bios_lock"),

      erasure_status:
        this.getEntry("erasure", "state") ||
        this.getEntry("erasures", "state") ||
        this.getEntryFromFullXml("erasure", "state") ||
        this.getEntryFromFullXml("erasures", "state") ||
        this.getRawEntry("state") ||
        this.getRawEntry("erasure_state") ||
        this.getRawEntry("erasure_status"),

      erasure_standard:
        this.getEntry("erasure", "erasure_standard_name") ||
        this.getEntryFromFullXml("erasure", "erasure_standard_name") ||
        this.getRawEntry("erasure_standard_name") ||
        this.getRawEntry("erasure_standard"),

      erasure_start_time:
        this.getEntry("erasure", "start_time") ||
        this.getEntryFromFullXml("erasure", "start_time") ||
        this.getRawEntry("start_time") ||
        this.getRawEntry("erasure_start_time"),

      erasure_end_time:
        this.getEntry("erasure", "end_time") ||
        this.getEntryFromFullXml("erasure", "end_time") ||
        this.getRawEntry("end_time") ||
        this.getRawEntry("erasure_end_time"),

      erasure_duration:
        this.getEntry("erasure", "duration") ||
        this.getEntryFromFullXml("erasure", "duration") ||
        this.getRawEntry("duration") ||
        this.getRawEntry("erasure_duration"),

      verification_status:
        this.getEntry("erasure", "verification_status") ||
        this.getRawEntry("verification_status"),

      report_uuid: this.getReportId(),
      blancco_report_id: this.getReportId(),
      blancco_cert_url: this.getReportUrl(),

      cosmetic_grade: "",
      functional_grade: "",
      final_grade: "",
      resale_value: "",
      rebate_value: "",
      reuse_status: "",
      recycling_status: "",
      quarantine_status: "",
      client_asset_id: "",
      collection_reference: "",
      job_reference: "",
      pallet_reference: "",
      location_collected_from: "",
      processed_by: "",
      processing_notes: ""
    };

    const isApple =
      (result.make || "").toLowerCase().includes("apple") ||
      (result.manufacturer || "").toLowerCase().includes("apple") ||
      (result.model || "").toLowerCase().includes("macbook") ||
      (result.product_name || "").toLowerCase().includes("macbook");

    if (isApple) {
      result.make = "Apple";
      result.manufacturer = "Apple";

      if (!result.processor) {
        result.processor = this.extractAppleProcessor(result.model || result.product_name);
      }

      if (!result.gpu) {
        result.gpu = this.extractAppleGpu(result.processor || result.model || result.product_name);
      }

      if (!result.year) {
        result.year =
          this.extractYearFromText(result.model) ||
          this.extractYearFromText(result.product_name);
      }

      if (!result.hdd && result.drive_capacity) {
        result.hdd = result.drive_capacity;
      }

      if (!result.drive_capacity && result.hdd) {
        result.drive_capacity = result.hdd;
      }
    }

    return result;
  },

  async saveToDb(parsed) {
    if (!parsed.serial) {
      showAlert("No serial number in Blancco data — nothing written", "warning");
      return null;
    }

    if (!parsed.serial_match) {
      showAlert(
        `Serial mismatch — requested: ${parsed.requested_serial}, returned: ${parsed.returned_serial}`,
        "warning"
      );
      return null;
    }

    const result = await qryWriteBlanccoToAsset.run({
      serial:             parsed.serial,
      cpu:                parsed.processor,
      ram:                parsed.ram,
      hdd:                parsed.drive_capacity || parsed.hdd,
      year:               parsed.year,
      screen_size:        parsed.screen_size,
      resolution:         parsed.screen_resolution,
      graphics:           parsed.gpu,
      erasure_status:     parsed.erasure_status,
      erasure_standard:   parsed.erasure_standard,
      battery_health:     parsed.battery_health,
      drive_model:        parsed.drive_model,
      drive_interface:    parsed.drive_interface,
      apple_no:           parsed.model_id || parsed.family || "",
      blancco_report_id:  parsed.blancco_report_id,
      blancco_cert_url:   parsed.blancco_cert_url
    });

    if (!result || !result.length) {
      showAlert(`No asset found with serial: ${parsed.serial}`, "error");
      return null;
    }

    return result[0];
  },

  async fetchAndSave() {
    await BlanccoSearch.run();

    const parsed = this.parseBlancco();

    const saved = await this.saveToDb(parsed);
    if (!saved) return;

    await qry_GetAssetById.run();

    showAlert(
      `Saved — ${parsed.product_name || parsed.model} (${parsed.serial})`,
      "success"
    );
  },

  debugResponse() {
    const raw = BlanccoSearch.data;

    return {
      data_type: typeof raw,
      has_data: !!raw,
      keys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      preview: JSON.stringify(raw).slice(0, 500),
      requested_serial: this.getRequestedSerial(),
      report_id: this.getReportId(),
      report_url: this.getReportUrl()
    };
  }
};