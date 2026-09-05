// Enhance meal notifications with exact foods and quantities.
(function(){
  if (!("Notification" in window)) return;
  const NativeNotification = window.Notification;

  function reminderDetailsFromTitle(title){
    const type = Object.keys(labels || {}).find(t => title.includes(labels[t]));
    if (!type) return null;
    const m = meal(type);
    if (!m) return null;
    const items = (m.ingredients || []).map(i => `${i.amount} ${i.unit} ${i.name}`);
    const z = mt(m);
    return {
      type,
      meal: m,
      body: items.length
        ? `${items.join(" · ")} | סה״כ ${Math.round(z.p)} ג׳ חלבון, ${Math.round(z.k)} קק״ל`
        : m.name
    };
  }

  function SmartNotification(title, options={}){
    const detail = reminderDetailsFromTitle(String(title || ""));
    if (detail) {
      options = {
        ...options,
        body: `${state.settings.mealTimes[detail.type]} — ${detail.body}`,
        icon: "./icon-192.png"
      };
    }
    return new NativeNotification(title, options);
  }

  Object.defineProperty(SmartNotification, "permission", { get: () => NativeNotification.permission });
  SmartNotification.requestPermission = (...args) => NativeNotification.requestPermission(...args);
  window.Notification = SmartNotification;
})();