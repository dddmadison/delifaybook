package com.delifaybook.server.global.auth;

import com.delifaybook.server.global.security.DbUserDetails;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Profile("dev")
@Component
public class DevCurrentUserProvider implements CurrentUserProvider {

    private static final Long DEV_USER_ID = 1L;

    @Override
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            // dev에서는 로그인 전에도 개발 편의상 폴백 허용
            return DEV_USER_ID;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof DbUserDetails dbUser) {
            return dbUser.getId();
        }

        // 예상과 다른 principal이면 dev에서는 폴백(개발 계속 가능)
        return DEV_USER_ID;
    }
}
