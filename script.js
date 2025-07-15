document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const courseMap = {};
    courses.forEach(course => {
        courseMap[course.dataset.id] = course;
    });

    const resetButton = document.getElementById('resetCurriculum');

    // Función para verificar si un curso puede ser desbloqueado
    function canUnlockCourse(courseElement) {
        const prerequisites = courseElement.dataset.prerequisites;

        // Verificar prerrequisitos de semestres completos primero
        const prerequisiteSemesters = courseElement.dataset.prerequisitesSemesters;
        if (prerequisiteSemesters) {
            const semesterIds = prerequisiteSemesters.split(',').map(id => id.trim());
            const allSemestersCompleted = semesterIds.every(semesterId => {
                const semesterElement = document.getElementById(semesterId);
                if (semesterElement) {
                    const semesterCourses = semesterElement.querySelectorAll('.course');
                    const allCoursesInSemesterCompleted = Array.from(semesterCourses).every(semCourse => semCourse.classList.contains('completed'));
                    return allCoursesInSemesterCompleted;
                }
                return false; // Si el semestre no existe, no se puede completar
            });
            if (!allSemestersCompleted) {
                return false;
            }
        }

        // Luego verificar prerrequisitos de cursos individuales
        if (prerequisites) {
            const prereqIds = prerequisites.split(',').map(id => id.trim());
            const allCoursePrerequisitesMet = prereqIds.every(prereqId => {
                const prereqCourse = courseMap[prereqId];
                const isPrereqCompleted = prereqCourse && prereqCourse.classList.contains('completed');
                return isPrereqCompleted;
            });
            if (!allCoursePrerequisitesMet) {
                return false;
            }
        }

        return true; // No tiene prerrequisitos o todos están cumplidos
    }


    // Función para actualizar el estado de todos los cursos (bloqueado, desbloqueado, completado)
    function updateCourseStates() {
        let changed = true;
        let iterationCount = 0;
        const maxIterations = 20; // Prevenir bucles infinitos en caso de dependencias circulares complejas

        while (changed && iterationCount < maxIterations) {
            changed = false;
            iterationCount++;

            courses.forEach(course => {
                // Si un curso ya está completado, se mantiene así y no se toca su estado de bloqueo/desbloqueo.
                if (course.classList.contains('completed')) {
                    // Nos aseguramos de que no tenga las otras clases si está completado.
                    course.classList.remove('blocked', 'unlocked');
                    return; // No hacer más cambios en este curso
                }

                // Si no está completado, evaluamos si puede desbloquearse
                if (canUnlockCourse(course)) {
                    // Si puede desbloquearse y no tiene la clase 'unlocked'
                    if (!course.classList.contains('unlocked')) {
                        course.classList.add('unlocked');
                        course.classList.remove('blocked'); // Importante: remover blocked al desbloquear
                        changed = true;
                    }
                } else {
                    // Si no puede desbloquearse y no tiene la clase 'unlocked'
                    if (!course.classList.contains('unlocked')) { // Si no es unlocked (y no completed), debería ser blocked
                        if (!course.classList.contains('blocked')) {
                            course.classList.add('blocked');
                            course.classList.remove('unlocked'); // Importante: remover unlocked al bloquear
                            changed = true;
                        }
                    }
                }
            });
        }
    }

    // Función para inicializar (o reiniciar) el estado de todos los cursos
    function initializeCourses() {
        courses.forEach(course => {
            const checkbox = course.querySelector('input[type="checkbox"]');
            checkbox.checked = false; // Desmarcar todos los checkboxes
            // Primero, remover todas las clases de estado para limpiar completamente
            course.classList.remove('completed', 'unlocked', 'blocked');

            // Luego, aplicar las clases iniciales según si tiene o no prerrequisitos
            if (!course.dataset.prerequisites && !course.dataset.prerequisitesSemesters) {
                course.classList.add('unlocked'); // Cursos sin prerrequisitos inician desbloqueados
            } else {
                course.classList.add('blocked'); // Cursos con prerrequisitos inician bloqueados
            }
        });
        updateCourseStates(); // Ejecutar después de la inicialización para propagar desbloqueos
    }

    // Manejar el clic en el checkbox de cada curso
    courses.forEach(course => {
        const checkbox = course.querySelector('input[type="checkbox"]');

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                // Solo permite marcar si el ramo está desbloqueado
                if (course.classList.contains('unlocked')) {
                    course.classList.add('completed');
                    course.classList.remove('unlocked'); // Una vez completado, ya no es solo 'unlocked'
                } else {
                    // Si intenta marcar un ramo bloqueado, deshacer la acción del checkbox
                    checkbox.checked = false;
                }
            } else {
                // Al desmarcar, siempre se quita el estado de completado
                course.classList.remove('completed');
            }
            // Después de cualquier cambio, reevaluar el estado de todos los cursos
            updateCourseStates();
        });
    });

    // Event listener para el botón de reinicio
    resetButton.addEventListener('click', () => {
        initializeCourses(); // Llamar a la función de inicialización para reiniciar
    });

    // Ejecutar al cargar la página para establecer el estado inicial
    initializeCourses();
});
