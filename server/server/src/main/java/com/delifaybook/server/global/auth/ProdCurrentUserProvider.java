// ProdCurrentUserProvider.java
package com.delifaybook.server.global.auth;

import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;
import com.delifaybook.server.global.security.DbUserDetails;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Profile("!dev")
@Component
public class ProdCurrentUserProvider implements CurrentUserProvider {

    @Override
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 인증 없음 -> 항상 401 (500 금지)
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof DbUserDetails dbUser) {
            return dbUser.getId();
        }

        // 예상치 못한 principal 타입 -> 인증정보 취급 불가 -> 401로 고정
        throw new ApiException(
                ErrorCode.AUTH_REQUIRED,
                "예상하지 못한 principal 타입=" + principal.getClass().getName()
        );
    }
}
