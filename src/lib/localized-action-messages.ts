import type { Locale } from "@/lib/i18n";

export function orderActionMessages(locale: Locale) {
  return locale === "en"
    ? {
        fastSubmit: "The form was submitted too quickly. Check the details and try again.",
        requiredFields: "Complete the required fields.",
        unavailable: "Order submission is temporarily unavailable. Please try again later.",
        throttled: "Too many orders were submitted in a short time. Please try again later.",
        invalidService: "Choose a service from the list.",
        invalidPackage: "Choose a work package.",
        invalidAddons: "Choose add-ons available for the selected service.",
        invalidReference: "Choose a work example from the selected service.",
        clientNameRequired: "Enter your name.",
        contactRequired: "Provide valid contact details.",
        resultDescriptionRequired: "Describe the expected result.",
        stylePreferencesRequired: "Add a visual style or reference.",
        saveFailed: "The order could not be saved. Please try again later.",
        claimFailed: "Access to the order could not be prepared. Please submit the form again."
      }
    : {
        fastSubmit: "Форма отправлена слишком быстро. Проверьте данные и попробуйте ещё раз.",
        requiredFields: "Заполните обязательные поля",
        unavailable: "Сохранение заказа временно недоступно. Попробуйте позже.",
        throttled: "Слишком много заявок за короткое время. Попробуйте позже.",
        invalidService: "Выберите услугу из списка",
        invalidPackage: "Выберите пакет работ",
        invalidAddons: "Выберите дополнительные услуги для выбранной услуги",
        invalidReference: "Выберите пример работы из списка услуги",
        clientNameRequired: "Укажите имя",
        contactRequired: "Укажите корректный контакт",
        resultDescriptionRequired: "Опишите ожидаемый результат",
        stylePreferencesRequired: "Добавьте стиль или ориентир",
        saveFailed: "Не удалось сохранить заказ. Попробуйте позже.",
        claimFailed: "Не удалось подготовить доступ к заявке. Попробуйте отправить форму ещё раз."
      };
}

export function accountActionMessages(locale: Locale) {
  return locale === "en"
    ? {
        invalidEmail: "Enter a valid email address.",
        passwordTooShort: "Use a longer password.",
        fullNameRequired: "Enter your name.",
        invalidLoginData: "Check your sign-in details.",
        invalidRegistrationData: "Check your registration details.",
        signInUnavailable: "Sign-in is temporarily unavailable. Please try again later.",
        signInFailed: "Sign-in failed. Check your email and password.",
        registrationUnavailable: "Registration is temporarily unavailable. Please try again later.",
        adminEmailRestricted:
          "This email is reserved for staff access. Use the staff sign-in page.",
        registrationDefault:
          "Registration failed. Check the email address or try again later.",
        registrationRateLimit:
          "Too many registration emails were requested. Please try again later.",
        registrationEmailNotAuthorized:
          "The confirmation email could not be sent to this address. Check the address or use another one."
      }
    : {
        invalidEmail: "Введите корректный email",
        passwordTooShort: "Пароль должен быть длиннее",
        fullNameRequired: "Укажите имя",
        invalidLoginData: "Проверьте данные входа.",
        invalidRegistrationData: "Проверьте данные регистрации.",
        signInUnavailable: "Вход временно недоступен. Попробуйте позже.",
        signInFailed: "Не удалось войти. Проверьте email и пароль.",
        registrationUnavailable: "Регистрация временно недоступна. Попробуйте позже.",
        adminEmailRestricted:
          "Этот email используется для административного доступа. Войдите через административную панель.",
        registrationDefault:
          "Не удалось зарегистрироваться. Проверьте email или попробуйте позже.",
        registrationRateLimit:
          "Слишком много писем регистрации. Попробуйте позже или используйте демо-аккаунт.",
        registrationEmailNotAuthorized:
          "Не удалось отправить письмо на этот адрес. Проверьте email или используйте другой адрес."
      };
}

export function attachmentActionMessages(locale: Locale) {
  return locale === "en"
    ? {
        tooLarge: "Each file must be no larger than 10 MB.",
        unsupportedType: "Only PDF, DOC, DOCX, TXT, JPEG, PNG and WebP files are supported.",
        tooMany: "You can attach no more than 5 files.",
        uploadFailed: "The files could not be uploaded. Check them and try again.",
        metadataFailed: "The order files could not be saved. Please try again.",
        notFound: "The file was not found.",
        forbidden: "You do not have permission to delete this file.",
        wrongRequest: "The file does not belong to this order.",
        storageDeleteFailed: "The file could not be removed from storage.",
        metadataDeleteFailed:
          "The file was removed from storage, but its record could not be deleted."
      }
    : {
        tooLarge: "Файл должен быть не больше 10 МБ.",
        unsupportedType: "Поддерживаются только PDF, DOC, DOCX, TXT, JPEG, PNG и WebP.",
        tooMany: "Можно приложить не больше 5 файлов.",
        uploadFailed: "Не удалось загрузить материалы. Проверьте файлы и попробуйте ещё раз.",
        metadataFailed: "Не удалось сохранить материалы заказа. Попробуйте ещё раз.",
        notFound: "Файл не найден.",
        forbidden: "Недостаточно прав для удаления файла.",
        wrongRequest: "Файл не относится к указанной заявке.",
        storageDeleteFailed: "Не удалось удалить файл из хранилища.",
        metadataDeleteFailed: "Файл удалён из хранилища, но метаданные удалить не удалось."
      };
}
